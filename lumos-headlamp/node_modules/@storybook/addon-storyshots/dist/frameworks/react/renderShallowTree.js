"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const shallow_1 = __importDefault(require("react-test-renderer/shallow"));
function getRenderedTree(story, context, { renderer, serializer }) {
    const storyElement = story.render();
    const shallowRenderer = renderer || shallow_1.default.createRenderer();
    const tree = shallowRenderer.render(storyElement);
    return serializer ? serializer(tree) : tree;
}
exports.default = getRenderedTree;
