declare const Zotero: any
// declare const Components: any

const monkey_patch_marker = 'StorageScannerMonkeyPatched'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function patch(object, method, patcher) {
  if (object[method][monkey_patch_marker]) return
  object[method] = patcher(object[method])
  object[method][monkey_patch_marker] = true
}

class StorageScanner {
  private duplicates: string
  private noattachments: string
  private globals: Record<string, any>

  // eslint-disable-next-line @typescript-eslint/require-await
  public async load(globals: Record<string, any>) {
    this.globals = globals
    if (!this.duplicates) {
      // https://groups.google.com/d/msg/zotero-dev/QYNGxqTSpaQ/uvGObVNlCgAJ
      await Zotero.Schema.schemaUpdatePromise

      let attachmentTypeID
      for (const type of await Zotero.DB.queryAsync("select itemTypeID from itemTypes where typeName = 'attachment'")) {
        attachmentTypeID = type.itemTypeID
      }

      this.duplicates = `
        SELECT
          item.itemID,
          attachment.path,
          CASE attachment.linkMode WHEN ${Zotero.Attachments.LINK_MODE_LINKED_URL} THEN 1 ELSE 0 END AS isLinkedURL,
          COALESCE(duplicates.duplicates, 1) as duplicates
        FROM items item
        LEFT JOIN itemAttachments attachment ON attachment.itemID = item.itemID
        LEFT JOIN (
          SELECT parentItemID, contentType, COUNT(*) as duplicates
          FROM itemAttachments
          WHERE linkMode <> ${Zotero.Attachments.LINK_MODE_LINKED_URL} AND itemID NOT IN (select itemID from deletedItems)
          GROUP BY parentItemID, contentType
        ) duplicates ON attachment.parentItemID = duplicates.parentItemID AND attachment.contentType = duplicates.contentType
        WHERE
            item.itemTypeID = ${attachmentTypeID}
          AND
            item.itemID NOT IN (select itemID from deletedItems)
          AND
            (
                attachment.path IS NULL
              OR
                (attachment.linkMode IS NOT NULL AND attachment.linkMode <> ${Zotero.Attachments.LINK_MODE_LINKED_URL})
            )
      `.replace(/\n/g, ' ').trim()
      Zotero.debug(`StorageScanner: duplicates = ${this.duplicates}`)

      this.noattachments = `
	      SELECT item.itemID, COUNT(attachment.itemID) AS attachments
        FROM items item
        JOIN itemTypes ON item.itemTypeID = itemTypes.itemTypeID AND itemTypes.typeName NOT IN ('note', 'attachment')
        LEFT JOIN itemAttachments attachment ON attachment.parentItemID = item.itemID AND attachment.itemID NOT IN (select itemID from deletedItems)
        WHERE item.itemID NOT IN (select itemID from deletedItems)
        GROUP BY item.itemID

        UNION

        SELECT itemID, CASE WHEN parentItemID IS NULL THEN 0 ELSE 1 END as attachments
        FROM itemAttachments attachment
        WHERE attachment.itemID NOT IN (select itemID from deletedItems)
      `.replace(/\n/g, ' ').trim()
    }
  }

  public async scan() {
    if (!this.duplicates) return

    // Zotero.Attachments.LINK_MODE_LINKED_URL // ignore this
    // Zotero.Attachments.LINK_MODE_IMPORTED_URL // snapshot
    // Zotero.Attachments.LINK_MODE_IMPORTED_FILE
    // LINK_MODE_LINKED_FILE

    const attachments = (await Zotero.DB.queryAsync(this.duplicates)) || [] // apparently 'no results' gets me 'null', not an empty list. Sure, ok.

    Zotero.debug(`StorageScanner.attachments: ${attachments.length}`)

    for (const attachment of attachments) {
      Zotero.debug(`StorageScanner.attachment: ${JSON.stringify({itemID: attachment.itemID, path: attachment.path, duplicates: attachment.duplicates})}`)
      const item = await Zotero.Items.getAsync(attachment.itemID)
      /*
        because getAsync isn't "same as get but asynchronously" but "sort
        of same as get but asynchronously, however if the object was not
        already loaded by some user interaction you're out of luck". BTW,
        if you could know at this point that getAsync would get you a loaded
        object, you could just have called "get". Nice.
        https://groups.google.com/d/msg/zotero-dev/QYNGxqTSpaQ/nGKJakGnBAAJ
        https://groups.google.com/d/msg/zotero-dev/naAxXIbpDhU/iSLpXo-UBQAJ
      */
      await item.loadAllData()

      let save = false

      if (this.updateTag(item, '#broken_attachments', !attachment.isLinkedURL && !(await item.getFilePathAsync()))) save = true
      if (this.updateTag(item, '#multiple_attachments_of_same_type', attachment.duplicates > 1)) save = true
      Zotero.debug(`StorageScanner.save: ${save}`)

      if (save) await item.saveTx()
    }

    const items = (await Zotero.DB.queryAsync(this.noattachments)) || []
    Zotero.debug(`StorageScanner.items: ${items.length}`)
    for (const status of items) {
      const item = await Zotero.Items.getAsync(status.itemID)
      await item.loadAllData()

      let save = false
      if (this.updateTag(item, '#nosource ', !status.attachments)) save = true
      if (save) await item.saveTx()
    }
  }

  private updateTag(item, tag, add) {
    Zotero.debug(`StorageScanner.updateTag('${item.id}.${tag}', ist: ${item.hasTag(tag)}, soll: ${add})`)
    if (add) {
      if (item.hasTag(tag)) return false
      item.addTag(tag)
    }
    else {
      if (!item.hasTag(tag)) return false
      item.removeTag(tag)
    }

    return true
  }
}

Zotero.StorageScanner = new StorageScanner
