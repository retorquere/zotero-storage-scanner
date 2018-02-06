// tslint:disable:no-console

// const replace = require('replace')

import * as webpack from 'webpack'
import * as path from 'path'

import BailPlugin from 'zotero-plugin/plugin/bail'

import CircularDependencyPlugin = require('circular-dependency-plugin')
// import AfterBuildPlugin = require('./zotero-webpack/plugin/after-build')

import 'zotero-plugin/make-dirs'
import 'zotero-plugin/copy-assets'
import 'zotero-plugin/rdf'
import 'zotero-plugin/version'

const config = {
  node: { fs: 'empty' },
  resolveLoader: {
    alias: {
      'pegjs-loader': path.join(__dirname, './zotero-webpack/loader/pegjs.ts'),
      'json-loader': path.join(__dirname, './zotero-webpack/loader/json.ts'),
      'wrap-loader': 'zotero-plugin/loader/wrap',
      'bcf-loader': path.join(__dirname, './setup/loaders/bcf.ts'),
    },
  },
  module: {
    rules: [
      { test: /\.pegjs$/, use: [ 'pegjs-loader' ] },
      { test: /\.json$/, use: [ 'json-loader' ] },
      { test: /\.bcf$/, use: [ 'bcf-loader' ] },
      { test: /\.ts$/, exclude: [ /node_modules/ ], use: [ 'wrap-loader', 'ts-loader' ] },
    ],
  },

  plugins: [
    new webpack.NamedModulesPlugin(),
    new CircularDependencyPlugin({ failOnError: true }),
    /*
    new AfterBuildPlugin((stats, options) => {
      const ccp = options.plugins.find(plugin => plugin instanceof webpack.optimize.CommonsChunkPlugin).filenameTemplate
      replace({
        regex: `window\\["${options.output.jsonpFunction}"\\]`,
        replacement: options.output.jsonpFunction,
        paths: [path.join(options.output.path, ccp)],
      })
    }),
    */
    BailPlugin,
  ],

  context: path.resolve(__dirname, './content'),

  entry: {
    StorageScanner: './StorageScanner.ts',
  },

  output: {
    path: path.resolve(__dirname, './build/content'),
    filename: '[name].js',
    jsonpFunction: 'Zotero.WebPackedStorageScanner',
    devtoolLineToLine: true,
    pathinfo: true,
    library: 'Zotero.[name]',
    libraryTarget: 'assign',
  },
}

export default config
