import * as fs from 'fs';
import { isAbsolute, resolve } from 'path';
import { readFileSync, existsSync, readdirSync, lstatSync, statSync, writeFileSync, appendFileSync, mkdirSync, symlinkSync, utimesSync } from 'fs';
import { removeSync, outputFileSync, mkdirpSync } from 'fs-extra';
const symlinkOrCopySync = require('symlink-or-copy').sync;

const logger = require('heimdalljs-logger')('broccoli:outputWrapper');

const WHITELISTEDOPERATION = new Set([
  'readFileSync',
  'existsSync',
  'lstatSync',
  'readdirSync',
  'statSync',
  'writeFileSync',
  'appendFileSync',
  'rmdirSync',
  'mkdirSync',
  'unlinkSync',
  'symlinkOrCopySync',
  'symlinkSync',
  'utimesSync',
  'outputFileSync'
]);

function handleFs(target: any, propertyName: string, node: any, relativePath: string, ...fsArguments: Array<any>) {
  let srcPath = '';
  if (propertyName === 'symlinkOrCopySync') {
    srcPath = relativePath;
    relativePath = fsArguments[0];
  }

  let outputPath = relativePath;
  if (!isAbsolute(relativePath)) {
    outputPath = resolve(node.outputPath + '/' + relativePath);
    if (!outputPath.includes(node.outputPath)) {
      throw new Error(`Traversing above the outputPath is not allowed. Relative path ${relativePath} traverses beyond ${node.outputPath}`);
    }
  }

  if(WHITELISTEDOPERATION.has(propertyName)) {
    logger.debug(`[operation:${propertyName}] at ${outputPath}`);
    switch (propertyName) {
      case 'symlinkOrCopySync':
        return symlinkOrCopySync(srcPath, outputPath);
      case 'outputFileSync':
        const content = fsArguments[0];
        fsArguments.shift();
        return outputFileSync(outputPath, content, ...fsArguments);
      case 'rmdirSync':
        if (fsArguments[0] && fsArguments[0].recursive) {
          return removeSync(outputPath);
        }
      case 'mkdirSync': {
        if (fsArguments[0] && fsArguments[0].recursive) {
          return mkdirpSync(outputPath);
        }
      }
      default:
        return target[propertyName](outputPath, ...fsArguments);
    }
  } else {
    throw new Error(`Operation ${propertyName} is not allowed to use. Allowed operations are ${Array.from(WHITELISTEDOPERATION).toString()}`);
  }
}

function outputWrapper (node: any): outputWrapper.FSOutput {
  return new Proxy(fs, {
    get(target: any, propertyName: string): any {
      return handleFs.bind(this, target, propertyName, node);
    }
  });
}
export = outputWrapper;

namespace outputWrapper {
  export interface FSOutput {
    readFileSync: typeof readFileSync,
    existsSync: typeof existsSync,
    lstatSync: typeof lstatSync,
    readdirSync: typeof readdirSync,
    statSync: typeof statSync,
    writeFileSync: typeof writeFileSync,
    appendFileSync: typeof appendFileSync,
    // TODO: node 10 reaches EOL and node 12 becomes LTS, we should revert this change.
    rmdirSync: (path: string, options?: { recursive?: boolean; }) => void,
    mkdirSync: typeof mkdirSync,
    unlinkSync: typeof fs.unlinkSync,
    symlinkOrCopySync: (srcPath: string, destPath: string) => void,
    symlinkSync: typeof symlinkSync,
    utimesSync: typeof utimesSync
  }
}
