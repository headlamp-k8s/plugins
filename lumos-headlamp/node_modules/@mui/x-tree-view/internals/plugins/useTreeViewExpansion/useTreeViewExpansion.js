import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import useEventCallback from '@mui/utils/useEventCallback';
import { populateInstance } from '../../useTreeView/useTreeView.utils';
export const useTreeViewExpansion = ({
  instance,
  params,
  models
}) => {
  const isNodeExpanded = React.useCallback(nodeId => {
    return Array.isArray(models.expanded.value) ? models.expanded.value.indexOf(nodeId) !== -1 : false;
  }, [models.expanded.value]);
  const isNodeExpandable = React.useCallback(nodeId => {
    var _instance$getNode;
    return !!((_instance$getNode = instance.getNode(nodeId)) != null && _instance$getNode.expandable);
  }, [instance]);
  const toggleNodeExpansion = useEventCallback((event, nodeId) => {
    if (nodeId == null) {
      return;
    }
    let newExpanded;
    if (models.expanded.value.indexOf(nodeId) !== -1) {
      newExpanded = models.expanded.value.filter(id => id !== nodeId);
    } else {
      newExpanded = [nodeId].concat(models.expanded.value);
    }
    if (params.onNodeToggle) {
      params.onNodeToggle(event, newExpanded);
    }
    models.expanded.setValue(newExpanded);
  });
  const expandAllSiblings = (event, nodeId) => {
    const node = instance.getNode(nodeId);
    const siblings = instance.getChildrenIds(node.parentId);
    const diff = siblings.filter(child => instance.isNodeExpandable(child) && !instance.isNodeExpanded(child));
    const newExpanded = models.expanded.value.concat(diff);
    if (diff.length > 0) {
      models.expanded.setValue(newExpanded);
      if (params.onNodeToggle) {
        params.onNodeToggle(event, newExpanded);
      }
    }
  };
  populateInstance(instance, {
    isNodeExpanded,
    isNodeExpandable,
    toggleNodeExpansion,
    expandAllSiblings
  });
};
useTreeViewExpansion.models = {
  expanded: {
    controlledProp: 'expanded',
    defaultProp: 'defaultExpanded'
  }
};
const DEFAULT_EXPANDED = [];
useTreeViewExpansion.getDefaultizedParams = params => {
  var _params$defaultExpand;
  return _extends({}, params, {
    defaultExpanded: (_params$defaultExpand = params.defaultExpanded) != null ? _params$defaultExpand : DEFAULT_EXPANDED
  });
};