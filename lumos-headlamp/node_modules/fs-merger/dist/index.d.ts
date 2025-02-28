/// <reference types="node" />
import nodefs = require('fs');
import { InputNode } from 'broccoli-node-api';
import { Options, Entry } from 'walk-sync';
declare class FSMerger {
    _dirList: FSMerger.Node[];
    MAP: {
        [key: string]: FSMerger.FSMergerObject;
    } | null;
    PREFIXINDEXMAP: {
        [key: number]: FSMerger.FSMergerObject;
    };
    LIST: FSMerger.FSMergerObject[];
    _atList: FSMerger[];
    fs: FSMerger.FS;
    constructor(trees: FSMerger.Node[] | FSMerger.Node);
    readFileSync(filePath: string, options?: {
        encoding?: string | null;
        flag?: string;
    } | string | null): FSMerger.FileContent | undefined;
    at(index: number): FSMerger;
    /**
     * Given an absolute path, returns a relative path suitable for using with the
     * other methods in this FSMerger. Does not emit paths starting with `../`;
     * paths outside this merged FS are instead returned as `null`.
     *
     * Note: If this FSMerger has a path that is inside another path, the first
     * one that contains the path will be used.
     *
     * Note 2: This method does not check whether the absolute path exists.
     *
     * @param absolutePath An absolute path to make relative.
     * @returns null if the path is not within any filesystem tree.
     */
    relativePathTo(absolutePath: string): {
        relativePath: string;
        at: number;
    } | null;
    _generateMap(): void;
    readFileMeta(filePath: string, options?: FSMerger.FileMetaOption): FSMerger.FileMeta | undefined;
    readdirSync(dirPath: string, options?: {
        encoding?: string | null;
        withFileTypes?: false;
    } | string | null): string[] | Buffer[];
    readdir(dirPath: string, options: {
        encoding?: string | null;
        withFileTypes?: false;
    } | string | undefined | null, callback: (err: NodeJS.ErrnoException | null, files?: string[] | Buffer[]) => void): void;
    entries(dirPath?: string, options?: Options): Entry[];
}
export = FSMerger;
declare namespace FSMerger {
    type FS = Pick<typeof nodefs, 'readFileSync' | 'readdirSync' | 'readdir' | 'existsSync' | 'lstatSync' | 'statSync'> & Pick<FSMerger, 'at' | 'readFileMeta' | 'entries' | 'relativePathTo'>;
    type FSMergerObject = {
        root: string;
        absRootWithSep: string;
        prefix: string | undefined;
        getDestinationPath: Function | undefined;
    };
    type FileContent = string | Buffer | null;
    type FileMeta = {
        path: string;
        prefix: string | undefined;
        getDestinationPath: Function | undefined;
    };
    type FileMetaOption = {
        basePath: string;
    };
    type Node = FSMergerObject | InputNode;
}
