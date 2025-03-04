'use strict';

var fs = require('fs');
var tmpdir = require('os').tmpdir();
var path = require('path');

var canSymlink = testCanSymlink();
// These can be overridden for testing
var defaultOptions = {
  isWindows: process.platform === 'win32',
  canSymlinkFile: canSymlink.files,
  canSymlinkDirectory: canSymlink.directories,
  fs: fs
};
var options = defaultOptions;

function testCanSymlink () {
  // We can't use options here because this function gets called before
  // its defined

  var result = {
    files: false,
    directories: false
  };

  if (process.platform !== 'win32') { return result; }

  var canLinkSrc  = path.join(tmpdir, "canLinkSrc.tmp");
  var canLinkDest = path.join(tmpdir, "canLinkDest.tmp");

  try {
    fs.writeFileSync(canLinkSrc, '');
  } catch (e) {
    return result;
  }

  try {
    fs.symlinkSync(canLinkSrc, canLinkDest);
    result.files = true;
  } catch (e) {
    result.files = false;
  }

  try {
    fs.unlinkSync(canLinkSrc);
    fs.unlinkSync(canLinkDest);
  } catch (e) {
    // In case the link failed
  }

  // Test symlinking a directory. For some reason, sometimes Windows allows
  // symlinking a file but not symlinking a directory...
  try {
    fs.mkdirSync(canLinkSrc);
  } catch (e) {
    result.directories = false;
    return result;
  }

  try {
    fs.symlinkSync(canLinkSrc, canLinkDest, 'dir');
    fs.rmdirSync(canLinkSrc);
    fs.rmdirSync(canLinkDest);
    result.directories = true;
  } catch (e) {
    try {
     fs.rmdirSync(canLinkSrc); 
    } catch(e) {
      // In case rmdir failed
    }
    result.directories = false;
  }

  return result;
}

module.exports = symlinkOrCopy;
function symlinkOrCopy () {
  throw new Error("This function does not exist. Use require('symlink-or-copy').sync");
}

module.exports._setOptions = function setOptions(newOptions) {
  options = newOptions || defaultOptions;
}

function cleanup(path) {
  if (typeof path !== 'string' ) { return; }
  // WSL (Windows Subsystem Linux) has issues with:
  //  * https://github.com/ember-cli/ember-cli/issues/6338
  //  * trailing `/` on symlinked directories
  //  * extra/duplicate `/` mid-path
  //  issue: https://github.com/Microsoft/BashOnWindows/issues/1421
  return path.replace(/\/$/,'').replace(/\/\//g, '/');
}

module.exports.sync = symlinkOrCopySync
function symlinkOrCopySync (srcPath, destPath) {
  if (options.isWindows) {
    symlinkWindows(srcPath, destPath);
  } else {
    symlink(srcPath, destPath);
  }
}

Object.defineProperty(module.exports, 'canSymlink', {
  get: function() {
    return !!(options.canSymlinkFile && options.canSymlinkDirectory);
  }
});

Object.defineProperty(module.exports, 'canSymlinkFile', {
  get: function() {
    return !!options.canSymlinkFile;
  }
});

Object.defineProperty(module.exports, 'canSymlinkDirectory', {
  get: function() {
    return !!options.canSymlinkDirectory;
  }
});

function symlink(_srcPath, _destPath) {
  var srcPath = cleanup(_srcPath);
  var destPath = cleanup(_destPath);

  var lstat = options.fs.lstatSync(srcPath);
  if (lstat.isSymbolicLink()) {
    // When we encounter symlinks, follow them. This prevents indirection
    // from growing out of control.
    // Note: At the moment `realpathSync` on Node is 70x slower than native,
    // because it doesn't use the standard library's `realpath`:
    // https://github.com/joyent/node/issues/7902
    // Can someone please send a patch to Node? :)
    srcPath = options.fs.realpathSync(srcPath);
  } else if (srcPath[0] !== '/') {
    // Resolve relative paths.
    // Note: On Mac and Linux (unlike Windows), process.cwd() never contains
    // symlink components, due to the way getcwd is implemented. As a
    // result, it's correct to use naive string concatenation in this code
    // path instead of the slower path.resolve(). (It seems unnecessary in
    // principle that path.resolve() is slower. Does anybody want to send a
    // patch to Node?)
    srcPath = process.cwd() + '/' + srcPath;
  }
  options.fs.symlinkSync(srcPath, destPath);
}

// Instruct Win32 to suspend path parsing by prefixing the path with a \\?\.
// Fix for https://github.com/broccolijs/broccoli-merge-trees/issues/42
var WINDOWS_PREFIX = "\\\\?\\";

function symlinkWindows(srcPath, destPath) {
  var stat = options.fs.lstatSync(srcPath);
  var isDir = stat.isDirectory();
  var wasResolved = false;

  if (stat.isSymbolicLink()) {
    srcPath = options.fs.realpathSync(srcPath);
    isDir = options.fs.lstatSync(srcPath).isDirectory();
    wasResolved = true;
  }

  srcPath = WINDOWS_PREFIX + (wasResolved ? srcPath : path.resolve(srcPath));
  destPath = WINDOWS_PREFIX + path.resolve(path.normalize(destPath));

  if (isDir) {
    if (options.canSymlinkDirectory) {
      options.fs.symlinkSync(srcPath, destPath, 'dir');
    } else {
      options.fs.symlinkSync(srcPath, destPath, 'junction');
    }
  } else {
    if (options.canSymlinkFile) {
      options.fs.symlinkSync(srcPath, destPath, 'file');
    } else {
      options.fs.writeFileSync(destPath, options.fs.readFileSync(srcPath), { flag: 'wx', mode: stat.mode });
      options.fs.utimesSync(destPath, stat.atime, stat.mtime);
    }
  }
}
