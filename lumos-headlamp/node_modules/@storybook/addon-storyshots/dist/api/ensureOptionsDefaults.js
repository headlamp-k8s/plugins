"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const test_bodies_1 = require("../test-bodies");
const Stories2SnapsConverter_1 = require("../Stories2SnapsConverter");
const ignore = ['**/node_modules/**'];
const defaultStories2SnapsConverter = new Stories2SnapsConverter_1.Stories2SnapsConverter();
function getIntegrityOptions({ integrityOptions }) {
    if (integrityOptions === false) {
        return false;
    }
    if (typeof integrityOptions !== 'object') {
        return false;
    }
    const ignoreOption = Array.isArray(integrityOptions.ignore)
        ? integrityOptions.ignore
        : [];
    return {
        ...integrityOptions,
        ignore: [...ignore, ...ignoreOption],
        absolute: true,
    };
}
function ensureOptionsDefaults(options) {
    const { suite = 'Storyshots', asyncJest, storyNameRegex, storyKindRegex, renderer, serializer, snapshotSerializers, stories2snapsConverter = defaultStories2SnapsConverter, test: testMethod = (0, test_bodies_1.snapshotWithOptions)({ renderer, serializer }), } = options;
    const integrityOptions = getIntegrityOptions(options);
    return {
        asyncJest,
        suite,
        storyNameRegex,
        storyKindRegex,
        stories2snapsConverter,
        testMethod,
        snapshotSerializers,
        integrityOptions,
    };
}
exports.default = ensureOptionsDefaults;
