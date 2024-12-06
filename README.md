# This plugin has been superceeded by Zotero Attachment Scanner

which can be found at https://github.com/SciImage/zotero-attachment-scanner

## Zotero Storage Scanner

A Zotero plugin to remove the broken & duplicate attachment link of the bibliography

Install by downloading the [latest version](https://github.com/retorquere/zotero-storage-scanner/releases/latest).

This plugin scans your attachments of storage to remove the missing & duplicate attachment link. The combination of the duplicated bibliography in Zotero could create a lot of duplicate attachments. Also when you use a plugin/ third-party software to directly remove the PDF of the bibliography, the attachment link becomes broken in Zotero. This plugin is designed to solve the problem.

Install by downloading the latest version and installing it from the Zotero add-ons screen.

## A little background on how the plugin works

There is no UI, this plugin scans your library after being launched from tools->storage scanner in the background.

If you run zotero-storage-scanner you will see a zotero process (name dependand on OS) kick off in your proccess manager (top, activity monitor, Task Manager), however as it works through your library it live updates two tags `#duplicates` and `#broken` as it goes. If those tags have no items attached to them after some time (variable depending on size of library) then you are golden, if there are entries tagged in either then your likely have duplicate articles or a file/DB has issues been identified with the most likely cause being a "missing" PDF sometimes caused by incomplete syncing.
