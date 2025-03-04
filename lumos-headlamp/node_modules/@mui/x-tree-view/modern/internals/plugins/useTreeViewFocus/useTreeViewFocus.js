import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import useEventCallback from '@mui/utils/useEventCallback';
import ownerDocument from '@mui/utils/ownerDocument';
import { populateInstance } from '../../useTreeView/useTreeView.utils';
import { useInstanceEventHandler } from '../../hooks/useInstanceEventHandler';
export const useTreeViewFocus = ({
  instance,
  params,
  state,
  setState,
  models,
  rootRef
}) => {
  const setFocusedNodeId = useEventCallback(nodeId => {
    const cleanNodeId = typeof nodeId === 'function' ? nodeId(state.focusedNodeId) : nodeId;
    setState(prevState => _extends({}, prevState, {
      focusedNodeId: cleanNodeId
    }));
  });
  const isNodeFocused = React.useCallback(nodeId => state.focusedNodeId === nodeId, [state.focusedNodeId]);
  const focusNode = useEventCallback((event, nodeId) => {
    if (nodeId) {
      setFocusedNodeId(nodeId);
      if (params.onNodeFocus) {
        params.onNodeFocus(event, nodeId);
      }
    }
  });
  populateInstance(instance, {
    isNodeFocused,
    focusNode
  });
  useInstanceEventHandler(instance, 'removeNode', ({
    id
  }) => {
    setFocusedNodeId(oldFocusedNodeId => {
      if (oldFocusedNodeId === id && rootRef.current === ownerDocument(rootRef.current).activeElement) {
        return instance.getChildrenIds(null)[0];
      }
      return oldFocusedNodeId;
    });
  });
  const createHandleFocus = otherHandlers => event => {
    otherHandlers.onFocus?.(event);

    // if the event bubbled (which is React specific) we don't want to steal focus
    if (event.target === event.currentTarget) {
      const isNodeVisible = nodeId => {
        const node = instance.getNode(nodeId);
        return node && (node.parentId == null || instance.isNodeExpanded(node.parentId));
      };
      let nodeToFocusId;
      if (Array.isArray(models.selected.value)) {
        nodeToFocusId = models.selected.value.find(isNodeVisible);
      } else if (models.selected.value != null && isNodeVisible(models.selected.value)) {
        nodeToFocusId = models.selected.value;
      }
      if (nodeToFocusId == null) {
        nodeToFocusId = instance.getNavigableChildrenIds(null)[0];
      }
      instance.focusNode(event, nodeToFocusId);
    }
  };
  const createHandleBlur = otherHandlers => event => {
    otherHandlers.onBlur?.(event);
    setFocusedNodeId(null);
  };
  const focusedNode = instance.getNode(state.focusedNodeId);
  const activeDescendant = focusedNode ? focusedNode.idAttribute : null;
  return {
    getRootProps: otherHandlers => ({
      onFocus: createHandleFocus(otherHandlers),
      onBlur: createHandleBlur(otherHandlers),
      'aria-activedescendant': activeDescendant ?? undefined
    })
  };
};
useTreeViewFocus.getInitialState = () => ({
  focusedNodeId: null
});
useTreeViewFocus.getDefaultizedParams = params => _extends({}, params, {
  disabledItemsFocusable: params.disabledItemsFocusable ?? false
});