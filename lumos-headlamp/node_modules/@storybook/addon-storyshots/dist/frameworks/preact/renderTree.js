"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/** @jsx h */
const preact_1 = require("preact");
const jsx_1 = __importDefault(require("preact-render-to-string/jsx"));
const boundRenderer = (_storyElement, _rendererOptions) => (0, jsx_1.default)(_storyElement, null, { pretty: '  ' });
function getRenderedTree(story, context, { renderer, ...rendererOptions }) {
    const currentRenderer = renderer || boundRenderer;
    const tree = currentRenderer((0, preact_1.h)(story.render, null), rendererOptions);
    return tree;
}
exports.default = getRenderedTree;
