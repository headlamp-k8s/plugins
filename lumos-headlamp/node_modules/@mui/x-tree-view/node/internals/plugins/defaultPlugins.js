"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEFAULT_TREE_VIEW_PLUGINS = void 0;
var _useTreeViewNodes = require("./useTreeViewNodes");
var _useTreeViewExpansion = require("./useTreeViewExpansion");
var _useTreeViewSelection = require("./useTreeViewSelection");
var _useTreeViewFocus = require("./useTreeViewFocus");
var _useTreeViewKeyboardNavigation = require("./useTreeViewKeyboardNavigation");
var _useTreeViewContextValueBuilder = require("./useTreeViewContextValueBuilder");
const DEFAULT_TREE_VIEW_PLUGINS = exports.DEFAULT_TREE_VIEW_PLUGINS = [_useTreeViewNodes.useTreeViewNodes, _useTreeViewExpansion.useTreeViewExpansion, _useTreeViewSelection.useTreeViewSelection, _useTreeViewFocus.useTreeViewFocus, _useTreeViewKeyboardNavigation.useTreeViewKeyboardNavigation, _useTreeViewContextValueBuilder.useTreeViewContextValueBuilder];

// We can't infer this type from the plugin, otherwise we would lose the generics.