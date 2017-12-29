declare const Zotero: any

export = new class StorageScanner {
  private query: string

  constructor() {
    window.addEventListener('load', e => { this.load() }, false)
  }

  public async load() {
    if (!this.query) {
      // Zotero startup is a hot mess; https://groups.google.com/d/msg/zotero-dev/QYNGxqTSpaQ/uvGObVNlCgAJ
      await Zotero.Schema.schemaUpdatePromise

      let attachmentTypeID
      for (const type of await Zotero.DB.queryAsync("select itemTypeID from itemTypes where typeName = 'attachment'")) {
        attachmentTypeID = type.itemTypeID
      }

      this.query = `
        WITH duplicates AS (
          SELECT parentItemID, contentType, COUNT(*) as duplicates
          FROM itemAttachments
          WHERE linkMode <> ${Zotero.Attachments.LINK_MODE_LINKED_URL} AND itemID NOT IN (select itemID from deletedItems)
          GROUP BY parentItemID, contentType
        )
        SELECT item.itemID, attachment.path, COALESCE(duplicates.duplicates, 1) as duplicates
        FROM items item
        LEFT JOIN itemAttachments attachment ON attachment.itemID = item.itemID
        LEFT JOIN duplicates on attachment.parentItemID = duplicates.parentItemID AND attachment.contentType = duplicates.contentType
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
    }
  }

  public async scan() {
    await this.load()

    // Zotero.Attachments.LINK_MODE_LINKED_URL // ignore this
    // Zotero.Attachments.LINK_MODE_IMPORTED_URL // snapshot
    // Zotero.Attachments.LINK_MODE_IMPORTED_FILE
    // LINK_MODE_LINKED_FILE

    const attachments = await Zotero.DB.queryAsync(this.query)

    for (const attachment of attachments) {
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

      if (this.updateTag(item, '#broken', !(await item.getFilePathAsync()))) save = true
      if (this.updateTag(item, '#duplicates', attachments.duplicates > 1)) save = true

      if (save) await item.saveTx()
    }
  }

  private updateTag(item, tag, add) {
    if (add) {
      if (item.hasTag(tag)) return false
      item.addTag(tag)
    } else {
      if (!item.hasTag(tag)) return false
      item.removeTag(tag)
    }

    return true
  }
}
