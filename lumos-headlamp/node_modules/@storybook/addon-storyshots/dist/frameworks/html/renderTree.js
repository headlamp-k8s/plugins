"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const global_1 = require("@storybook/global");
const { document, Node } = global_1.global;
function getRenderedTree(story) {
    const component = story.render();
    if (component instanceof Node) {
        return component;
    }
    const section = document.createElement('section');
    section.innerHTML = component;
    if (section.childElementCount > 1) {
        return section;
    }
    return section.firstChild;
}
exports.default = getRenderedTree;
