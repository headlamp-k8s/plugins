"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useTreeItem = useTreeItem;
var _useTreeViewContext = require("../internals/TreeViewProvider/useTreeViewContext");
function useTreeItem(nodeId) {
  const {
    instance,
    multiSelect
  } = (0, _useTreeViewContext.useTreeViewContext)();
  const expandable = instance ? instance.isNodeExpandable(nodeId) : false;
  const expanded = instance ? instance.isNodeExpanded(nodeId) : false;
  const focused = instance ? instance.isNodeFocused(nodeId) : false;
  const selected = instance ? instance.isNodeSelected(nodeId) : false;
  const disabled = instance ? instance.isNodeDisabled(nodeId) : false;
  const handleExpansion = event => {
    if (instance && !disabled) {
      if (!focused) {
        instance.focusNode(event, nodeId);
      }
      const multiple = multiSelect && (event.shiftKey || event.ctrlKey || event.metaKey);

      // If already expanded and trying to toggle selection don't close
      if (expandable && !(multiple && instance.isNodeExpanded(nodeId))) {
        instance.toggleNodeExpansion(event, nodeId);
      }
    }
  };
  const handleSelection = event => {
    if (instance && !disabled) {
      if (!focused) {
        instance.focusNode(event, nodeId);
      }
      const multiple = multiSelect && (event.shiftKey || event.ctrlKey || event.metaKey);
      if (multiple) {
        if (event.shiftKey) {
          instance.selectRange(event, {
            end: nodeId
          });
        } else {
          instance.selectNode(event, nodeId, true);
        }
      } else {
        instance.selectNode(event, nodeId);
      }
    }
  };
  const preventSelection = event => {
    if (event.shiftKey || event.ctrlKey || event.metaKey || disabled) {
      // Prevent text selection
      event.preventDefault();
    }
  };
  return {
    disabled,
    expanded,
    selected,
    focused,
    handleExpansion,
    handleSelection,
    preventSelection
  };
}