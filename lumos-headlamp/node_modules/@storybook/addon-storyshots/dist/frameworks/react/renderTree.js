"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_test_renderer_1 = __importDefault(require("react-test-renderer"));
function getRenderedTree(story, context, { renderer, ...rendererOptions }) {
    const StoryFn = story.render;
    const storyElement = react_1.default.createElement(StoryFn);
    const currentRenderer = renderer || react_test_renderer_1.default.create;
    const tree = currentRenderer(storyElement, rendererOptions);
    return tree;
}
exports.default = getRenderedTree;
