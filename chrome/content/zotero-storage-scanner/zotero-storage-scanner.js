Zotero.StorageScanner = {
	init: function () {
	},

	scan: function() {
    duplicates = {};

    function file_extension(filename)
    {
      var a = filename.split();
      if (a.length == 1 || ( a[0] = "" && a.length == 2 ) ) {
        return "";
      }
      return a.pop().toLowerCase();
    }

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
              duplicates[parent.id] = duplicates[item.id] || {};
              duplicates[parent.id][ext] = duplicates[parent.id][ext] || 0;
              duplicates[parent.id][ext] += 1;
            }
          }
        }
      }
    }

    for (var id in Object.keys(duplicates)) {
      var attachments = duplicates[id];
      dups = false
      for (var ext in Objects.keys(attachments)) {
        dups = dups || (attachments[ext] > 2);
      }
      if (dups) {
        var item = Zotero.Items.get(id);
        item.addTag('#duplicates');
      }
    }
	}
};

// Initialize the utility
window.addEventListener('load', function(e) { Zotero.StorageScanner.init(); }, false);
