import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import useEventCallback from '@mui/utils/useEventCallback';
import { populateInstance } from '../../useTreeView/useTreeView.utils';
import { publishTreeViewEvent } from '../../utils/publishTreeViewEvent';
export const useTreeViewNodes = ({
  instance,
  params
}) => {
  const nodeMap = React.useRef({});
  const getNode = React.useCallback(nodeId => nodeMap.current[nodeId], []);
  const insertNode = React.useCallback(node => {
    nodeMap.current[node.id] = node;
  }, []);
  const removeNode = React.useCallback(nodeId => {
    const newMap = _extends({}, nodeMap.current);
    delete newMap[nodeId];
    nodeMap.current = newMap;
    publishTreeViewEvent(instance, 'removeNode', {
      id: nodeId
    });
  }, [instance]);
  const isNodeDisabled = React.useCallback(nodeId => {
    if (nodeId == null) {
      return false;
    }
    let node = instance.getNode(nodeId);

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
  const getChildrenIds = useEventCallback(nodeId => Object.values(nodeMap.current).filter(node => node.parentId === nodeId).sort((a, b) => a.index - b.index).map(child => child.id));
  const getNavigableChildrenIds = nodeId => {
    let childrenIds = instance.getChildrenIds(nodeId);
    if (!params.disabledItemsFocusable) {
      childrenIds = childrenIds.filter(node => !instance.isNodeDisabled(node));
    }
    return childrenIds;
  };
  populateInstance(instance, {
    getNode,
    updateNode: insertNode,
    removeNode,
    getChildrenIds,
    getNavigableChildrenIds,
    isNodeDisabled
  });
};