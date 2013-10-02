// Only create main object once
if (!Zotero.StorageScanner) {
	let loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
					.getService(Components.interfaces.mozIJSSubScriptLoader);
	loader.loadSubScript("chrome://zotero-storage-scanner/content/zotero-storage-scanner.js");
}
