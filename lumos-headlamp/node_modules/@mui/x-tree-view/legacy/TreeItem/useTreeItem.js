import { useTreeViewContext } from '../internals/TreeViewProvider/useTreeViewContext';
export function useTreeItem(nodeId) {
  var _useTreeViewContext = useTreeViewContext(),
    instance = _useTreeViewContext.instance,
    multiSelect = _useTreeViewContext.multiSelect;
  var expandable = instance ? instance.isNodeExpandable(nodeId) : false;
  var expanded = instance ? instance.isNodeExpanded(nodeId) : false;
  var focused = instance ? instance.isNodeFocused(nodeId) : false;
  var selected = instance ? instance.isNodeSelected(nodeId) : false;
  var disabled = instance ? instance.isNodeDisabled(nodeId) : false;
  var handleExpansion = function handleExpansion(event) {
    if (instance && !disabled) {
      if (!focused) {
        instance.focusNode(event, nodeId);
      }
      var multiple = multiSelect && (event.shiftKey || event.ctrlKey || event.metaKey);

      // If already expanded and trying to toggle selection don't close
      if (expandable && !(multiple && instance.isNodeExpanded(nodeId))) {
        instance.toggleNodeExpansion(event, nodeId);
      }
    }
  };
  var handleSelection = function handleSelection(event) {
    if (instance && !disabled) {
      if (!focused) {
        instance.focusNode(event, nodeId);
      }
      var multiple = multiSelect && (event.shiftKey || event.ctrlKey || event.metaKey);
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
  var preventSelection = function preventSelection(event) {
    if (event.shiftKey || event.ctrlKey || event.metaKey || disabled) {
      // Prevent text selection
      event.preventDefault();
    }
  };
  return {
    disabled: disabled,
    expanded: expanded,
    selected: selected,
    focused: focused,
    handleExpansion: handleExpansion,
    handleSelection: handleSelection,
    preventSelection: preventSelection
  };
}