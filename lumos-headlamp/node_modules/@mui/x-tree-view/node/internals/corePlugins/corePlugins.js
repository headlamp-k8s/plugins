"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TREE_VIEW_CORE_PLUGINS = void 0;
var _useTreeViewInstanceEvents = require("./useTreeViewInstanceEvents");
/**
 * Internal plugins that creates the tools used by the other plugins.
 * These plugins are used by the tree view components.
 */
const TREE_VIEW_CORE_PLUGINS = exports.TREE_VIEW_CORE_PLUGINS = [_useTreeViewInstanceEvents.useTreeViewInstanceEvents];