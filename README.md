# Zotero Storage Scanner

No compatible with Zotero 5. This plugin scans your storage for missing attachments and possible duplicates

Install by downloading the [latest version](https://github.com/retorquere/zotero-storage-scanner/releases/latest).

---

## Support -- read carefully

My time is extremely limited for a number of very great reasons (you shall have to trust me on this). Because of this, I cannot accept bug reports
or support requests on anything but the latest version, currently at **0.0.16**. If you submit an issue report,
please include the version that you are on. By the time I get to your issue, the latest version might have bumped up already, and you
will have to upgrade (you might have auto-upgraded already however) and re-verify that your issue still exists. Apologies for the inconvenience, but such
are the breaks.

---

## A little background on what this does

There is no UI, this plugin scans your library after being launched from `tools->storage scanner` in the background.

If you run `zotero-storage-scanner` you will see a zotero process (name dependand on OS) kick off in your proccess manager (top, activity monitor, Task Manager), however as it works through your library it live updates two smart-folders `#duplicates` and `#broken` as it goes. If those two folders are empty after some time (variable depending on size of library) then you are golden, if there are entries tagged in either then your likely have duplicate articles or a file/DB has issues been identified with the most likely cause being a "missing" `PDF` sometimes caused by incomplete syncing.
