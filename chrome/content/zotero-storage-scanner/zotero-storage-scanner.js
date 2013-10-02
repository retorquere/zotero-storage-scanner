Zotero.StorageScanner = {
	init: function () {
	},
	
	scan: function() {
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
          }
        }
      }
    }
	}
	
};

// Initialize the utility
window.addEventListener('load', function(e) { Zotero.StorageScanner.init(); }, false);
