"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const hasDependency_1 = __importDefault(require("../hasDependency"));
const configure_1 = __importDefault(require("../configure"));
function setupAngularJestPreset() {
    // Angular + Jest + Storyshots = Crazy Shit:
    // We need to require 'jest-preset-angular/build/setupJest' before any storybook code
    // is running inside jest -  one of the things that `jest-preset-angular/build/setupJest` does is
    // extending the `window.Reflect` with all the needed metadata functions, that are required
    // for emission of the TS decorations like 'design:paramtypes'
    jest.requireActual('jest-preset-angular/setup-jest');
}
function test(options) {
    return (options.framework === 'angular' || (!options.framework && (0, hasDependency_1.default)('@storybook/angular')));
}
function load(options) {
    setupAngularJestPreset();
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
    jest.mock('@storybook/angular', () => {
        const renderAPI = jest.requireActual('@storybook/angular');
        renderAPI.addDecorator = mockStartedAPI.clientApi.addDecorator;
        renderAPI.addParameters = mockStartedAPI.clientApi.addParameters;
        return renderAPI;
    });
    // eslint-disable-next-line global-require
    const storybook = require('@storybook/angular');
    (0, configure_1.default)({
        ...options,
        storybook,
    });
    return {
        framework: 'angular',
        renderTree: jest.requireActual('./renderTree').default,
        renderShallowTree: () => {
            throw new Error('Shallow renderer is not supported for angular');
        },
        storybook,
    };
}
const angularLoader = {
    load,
    test,
};
exports.default = angularLoader;
