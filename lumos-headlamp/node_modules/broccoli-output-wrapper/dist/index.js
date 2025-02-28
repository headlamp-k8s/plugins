"use strict";
const fs = require("fs");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
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
function handleFs(target, propertyName, node, relativePath, ...fsArguments) {
    let srcPath = '';
    if (propertyName === 'symlinkOrCopySync') {
        srcPath = relativePath;
        relativePath = fsArguments[0];
    }
    let outputPath = relativePath;
    if (!path_1.isAbsolute(relativePath)) {
        outputPath = path_1.resolve(node.outputPath + '/' + relativePath);
        if (!outputPath.includes(node.outputPath)) {
            throw new Error(`Traversing above the outputPath is not allowed. Relative path ${relativePath} traverses beyond ${node.outputPath}`);
        }
    }
    if (WHITELISTEDOPERATION.has(propertyName)) {
        logger.debug(`[operation:${propertyName}] at ${outputPath}`);
        switch (propertyName) {
            case 'symlinkOrCopySync':
                return symlinkOrCopySync(srcPath, outputPath);
            case 'outputFileSync':
                const content = fsArguments[0];
                fsArguments.shift();
                return fs_extra_1.outputFileSync(outputPath, content, ...fsArguments);
            case 'rmdirSync':
                if (fsArguments[0] && fsArguments[0].recursive) {
                    return fs_extra_1.removeSync(outputPath);
                }
            case 'mkdirSync': {
                if (fsArguments[0] && fsArguments[0].recursive) {
                    return fs_extra_1.mkdirpSync(outputPath);
                }
            }
            default:
                return target[propertyName](outputPath, ...fsArguments);
        }
    }
    else {
        throw new Error(`Operation ${propertyName} is not allowed to use. Allowed operations are ${Array.from(WHITELISTEDOPERATION).toString()}`);
    }
}
function outputWrapper(node) {
    return new Proxy(fs, {
        get(target, propertyName) {
            return handleFs.bind(this, target, propertyName, node);
        }
    });
}
module.exports = outputWrapper;
//# sourceMappingURL=index.js.map