# broccoli-output-wrapper

This libary is to provide Proxy to FS operations for Broccoli. Broccoli Plugin developers can just write to the outputPath using the proxy.
This libary is not intended to use independently outside broccoli or broccoli-plugin as of now.

## APIs

* readFileSync
* existsSync
* lstatSync
* readdirSync
* statSync
* writeFileSync
* appendFileSync
* mkdirSync
* unlinkSync
* symlinkSync
* utimesSync

All these operations above are same as File Operations documented in node API [guide](https://nodejs.org/api/fs.html).

* rmdirSync

Perform same operation as node [guide](https://nodejs.org/api/fs.html#fs_fs_rmdirsync_path_options).
We have polyfilled `recursive: true` option to perform a recursive directory removal. In recursive mode, errors are not reported if path does not exist, and operations are retried on failure. Default: false
* [symlinkOrCopySync](https://github.com/broccolijs/node-symlink-or-copy#node-symlink-or-copy)
* [outputFileSync](https://github.com/jprichardson/node-fs-extra/blob/master/docs/outputFile-sync.md)