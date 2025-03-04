"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const configure_1 = require("./configure");
// eslint-disable-next-line global-require, jest/no-mocks-import
jest.mock('fs', () => require('../../../../__mocks__/fs'));
const setupFiles = (files) => {
    // eslint-disable-next-line no-underscore-dangle, global-require
    require('fs').__setMockFiles(files);
};
describe('preview files', () => {
    it.each `
    filepath
    ${'preview.ts'}
    ${'preview.tsx'}
    ${'preview.js'}
    ${'preview.jsx'}
    ${'config.ts'}
    ${'config.tsx'}
    ${'config.js'}
    ${'config.jsx'}
  `('resolves a valid preview file from $filepath', ({ filepath }) => {
        setupFiles({ [path_1.default.join('test', filepath)]: 'true' });
        expect((0, configure_1.getPreviewFile)('test/')).toEqual(`test${path_1.default.sep}${filepath}`);
    });
    it('returns false when none of the paths exist', () => {
        setupFiles(Object.create(null));
        expect((0, configure_1.getPreviewFile)('test/')).toEqual(false);
    });
});
describe('main files', () => {
    it.each `
    filepath
    ${'main.ts'}
    ${'main.tsx'}
    ${'main.js'}
    ${'main.jsx'}
  `('resolves a valid main file path from $filepath', ({ filepath }) => {
        setupFiles({ [path_1.default.join('test', filepath)]: 'true' });
        expect((0, configure_1.getMainFile)('test/')).toEqual(`test${path_1.default.sep}${filepath}`);
    });
    it('returns false when none of the paths exist', () => {
        setupFiles(Object.create(null));
        expect((0, configure_1.getPreviewFile)('test/')).toEqual(false);
    });
});
