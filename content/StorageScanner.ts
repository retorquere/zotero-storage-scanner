declare const Zotero: any

export = new class StorageScanner {
  /*
  constructor() {
    window.addEventListener('load', e => { this.load() }, false)
  }

  public async load() {
  }
  */

  public async scan() {
    // Zotero startup is a hot mess; https://groups.google.com/d/msg/zotero-dev/QYNGxqTSpaQ/uvGObVNlCgAJ
    await Zotero.Schema.schemaUpdatePromise

    const attachments = await Zotero.DB.queryAsync(`
      WITH duplicates AS (
        SELECT parentItemID, contentType, COUNT(*) as duplicates
        FROM itemAttachments
        WHERE itemID NOT IN (select itemID from deletedItems)
        GROUP BY parentItemID, contentType
      )
      SELECT itemAttachments.itemID, COALESCE(duplicates.duplicates, 1) as duplicates
      FROM itemAttachments
      LEFT JOIN duplicates on itemAttachments.parentItemID = duplicates.parentItemID AND itemAttachments.contentType = duplicates.contentType
      WHERE itemID NOT IN (select itemID from deletedItems)
    `.replace(/\n/g, ' ').trim())

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
