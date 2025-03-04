"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const configure_1 = __importDefault(require("../configure"));
const hasDependency_1 = __importDefault(require("../hasDependency"));
function test(options) {
    return options.framework === 'react' || (!options.framework && (0, hasDependency_1.default)('@storybook/react'));
}
function load(options) {
    let mockStartedAPI;
    jest.mock('@storybook/preview-api', () => {
        const previewAPI = jest.requireActual('@storybook/preview-api');
        return {
            ...previewAPI,
            start: (...args) => {
                mockStartedAPI = previewAPI.start(...args);
                return mockStartedAPI;
            },
        };
    });
    jest.mock('@storybook/react', () => {
        const renderAPI = jest.requireActual('@storybook/react');
        renderAPI.addDecorator = mockStartedAPI.clientApi.addDecorator;
        renderAPI.addParameters = mockStartedAPI.clientApi.addParameters;
        return renderAPI;
    });
    // eslint-disable-next-line global-require
    const storybook = require('@storybook/react');
    (0, configure_1.default)({
        ...options,
        storybook,
    });
    return {
        framework: 'react',
        renderTree: jest.requireActual('./renderTree').default,
        renderShallowTree: jest.requireActual('./renderShallowTree').default,
        storybook,
    };
}
const reactLoader = {
    load,
    test,
};
exports.default = reactLoader;
