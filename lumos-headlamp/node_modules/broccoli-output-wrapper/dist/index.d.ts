/// <reference types="node" />
import * as fs from 'fs';
import { readFileSync, existsSync, readdirSync, lstatSync, statSync, writeFileSync, appendFileSync, mkdirSync, symlinkSync, utimesSync } from 'fs';
declare function outputWrapper(node: any): outputWrapper.FSOutput;
export = outputWrapper;
declare namespace outputWrapper {
    interface FSOutput {
        readFileSync: typeof readFileSync;
        existsSync: typeof existsSync;
        lstatSync: typeof lstatSync;
        readdirSync: typeof readdirSync;
        statSync: typeof statSync;
        writeFileSync: typeof writeFileSync;
        appendFileSync: typeof appendFileSync;
        rmdirSync: (path: string, options?: {
            recursive?: boolean;
        }) => void;
        mkdirSync: typeof mkdirSync;
        unlinkSync: typeof fs.unlinkSync;
        symlinkOrCopySync: (srcPath: string, destPath: string) => void;
        symlinkSync: typeof symlinkSync;
        utimesSync: typeof utimesSync;
    }
}
