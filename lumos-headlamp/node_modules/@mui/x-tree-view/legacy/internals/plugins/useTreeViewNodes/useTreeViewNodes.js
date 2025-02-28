import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import useEventCallback from '@mui/utils/useEventCallback';
import { populateInstance } from '../../useTreeView/useTreeView.utils';
import { publishTreeViewEvent } from '../../utils/publishTreeViewEvent';
export var useTreeViewNodes = function useTreeViewNodes(_ref) {
  var instance = _ref.instance,
    params = _ref.params;
  var nodeMap = React.useRef({});
  var getNode = React.useCallback(function (nodeId) {
    return nodeMap.current[nodeId];
  }, []);
  var insertNode = React.useCallback(function (node) {
    nodeMap.current[node.id] = node;
  }, []);
  var removeNode = React.useCallback(function (nodeId) {
    var newMap = _extends({}, nodeMap.current);
    delete newMap[nodeId];
    nodeMap.current = newMap;
    publishTreeViewEvent(instance, 'removeNode', {
      id: nodeId
    });
  }, [instance]);
  var isNodeDisabled = React.useCallback(function (nodeId) {
    if (nodeId == null) {
      return false;
    }
    var node = instance.getNode(nodeId);

    // This can be called before the node has been added to the node map.
    if (!node) {
      return false;
    }
    if (node.disabled) {
      return true;
    }
    while (node.parentId != null) {
      node = instance.getNode(node.parentId);
      if (node.disabled) {
        return true;
      }
    }
    return false;
  }, [instance]);
  var getChildrenIds = useEventCallback(function (nodeId) {
    return Object.values(nodeMap.current).filter(function (node) {
      return node.parentId === nodeId;
    }).sort(function (a, b) {
      return a.index - b.index;
    }).map(function (child) {
      return child.id;
    });
  });
  var getNavigableChildrenIds = function getNavigableChildrenIds(nodeId) {
    var childrenIds = instance.getChildrenIds(nodeId);
    if (!params.disabledItemsFocusable) {
      childrenIds = childrenIds.filter(function (node) {
        return !instance.isNodeDisabled(node);
      });
    }
    return childrenIds;
  };
  populateInstance(instance, {
    getNode: getNode,
    updateNode: insertNode,
    removeNode: removeNode,
    getChildrenIds: getChildrenIds,
    getNavigableChildrenIds: getNavigableChildrenIds,
    isNodeDisabled: isNodeDisabled
  });
};