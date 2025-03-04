import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import useEventCallback from '@mui/utils/useEventCallback';
import { populateInstance } from '../../useTreeView/useTreeView.utils';
export var useTreeViewExpansion = function useTreeViewExpansion(_ref) {
  var instance = _ref.instance,
    params = _ref.params,
    models = _ref.models;
  var isNodeExpanded = React.useCallback(function (nodeId) {
    return Array.isArray(models.expanded.value) ? models.expanded.value.indexOf(nodeId) !== -1 : false;
  }, [models.expanded.value]);
  var isNodeExpandable = React.useCallback(function (nodeId) {
    var _instance$getNode;
    return !!((_instance$getNode = instance.getNode(nodeId)) != null && _instance$getNode.expandable);
  }, [instance]);
  var toggleNodeExpansion = useEventCallback(function (event, nodeId) {
    if (nodeId == null) {
      return;
    }
    var newExpanded;
    if (models.expanded.value.indexOf(nodeId) !== -1) {
      newExpanded = models.expanded.value.filter(function (id) {
        return id !== nodeId;
      });
    } else {
      newExpanded = [nodeId].concat(models.expanded.value);
    }
    if (params.onNodeToggle) {
      params.onNodeToggle(event, newExpanded);
    }
    models.expanded.setValue(newExpanded);
  });
  var expandAllSiblings = function expandAllSiblings(event, nodeId) {
    var node = instance.getNode(nodeId);
    var siblings = instance.getChildrenIds(node.parentId);
    var diff = siblings.filter(function (child) {
      return instance.isNodeExpandable(child) && !instance.isNodeExpanded(child);
    });
    var newExpanded = models.expanded.value.concat(diff);
    if (diff.length > 0) {
      models.expanded.setValue(newExpanded);
      if (params.onNodeToggle) {
        params.onNodeToggle(event, newExpanded);
      }
    }
  };
  populateInstance(instance, {
    isNodeExpanded: isNodeExpanded,
    isNodeExpandable: isNodeExpandable,
    toggleNodeExpansion: toggleNodeExpansion,
    expandAllSiblings: expandAllSiblings
  });
};
useTreeViewExpansion.models = {
  expanded: {
    controlledProp: 'expanded',
    defaultProp: 'defaultExpanded'
  }
};
var DEFAULT_EXPANDED = [];
useTreeViewExpansion.getDefaultizedParams = function (params) {
  var _params$defaultExpand;
  return _extends({}, params, {
    defaultExpanded: (_params$defaultExpand = params.defaultExpanded) != null ? _params$defaultExpand : DEFAULT_EXPANDED
  });
};