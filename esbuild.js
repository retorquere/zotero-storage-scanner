const path = require('path')
const fs = require('fs')
const esbuild = require('esbuild')
const rmrf = require('rimraf')

require('zotero-plugin/copy-assets')
require('zotero-plugin/rdf')
require('zotero-plugin/version')

async function build() {
  rmrf.sync('gen')
  await esbuild.build({
    bundle: true,
    format: 'iife',
    target: ['firefox60'],
    entryPoints: [ 'content/zotero-storage-scanner.ts' ],
    outdir: 'build/content',
    banner: { js: 'if (!Zotero.StorageScanner) {\n' },
    footer: { js: '\n}' },
  })
}

build().catch(err => {
  console.log(err)
  process.exit(1)
})
