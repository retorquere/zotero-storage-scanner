export = new class StorageScanner = {
  constructor() {
    window.addEventListener('load', e => { this.load() }, false)
  }

	load() {
	}

	public async scan() {
    duplicates = {};

    var items = Zotero.Items.getAll();
    for each(var item in items) {
      if (item.isAttachment()) {
        if (!item.attachmentPath) {
          Zotero.debug("Scanning " + item.id + " which has no path!");
        }

        if (item.attachmentPath && item.attachmentPath.indexOf("storage:") == 0) {
          var path = item.attachmentPath.substr(8);


          var file = Zotero.Attachments.getStorageDirectory(item.id);
          file.QueryInterface(Components.interfaces.nsILocalFile);
          file.setRelativeDescriptor(file, path);

          if (!file.exists()) {
            Zotero.debug("Broken " + item.attachmentPath);
            item.addTag('#broken');
          } else {
            var parent=Zotero.Items.get(item.getSource());
            if (parent) {
              var ext = file_extension(path);
              duplicates[parent.id] = duplicates[parent.id] || {};
              duplicates[parent.id][ext] = duplicates[parent.id][ext] || 0;
              duplicates[parent.id][ext] += 1;
            }
          }
        }
      }
    }

    for (var id in duplicates) {
      Zotero.debug('attachments for: ' + id);
      var attachments = duplicates[id];
      Zotero.debug('attachments: ' + typeof(attachments));
      dups = false
      for (var ext in attachments) {
        dups = dups || (attachments[ext] > 2);
      }
      if (dups) {
        var item = Zotero.Items.get(id);
        item.addTag('#duplicates');
      }
    }
	}

  private file_extension(filename) {
    const a = filename.split()
    if (a.length === 1 || (a[0] = '' && a.length === 2 )) return ''
    return a.pop().toLowerCase()
  }
}
