import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import useEventCallback from '@mui/utils/useEventCallback';
import ownerDocument from '@mui/utils/ownerDocument';
import { populateInstance } from '../../useTreeView/useTreeView.utils';
import { useInstanceEventHandler } from '../../hooks/useInstanceEventHandler';
export var useTreeViewFocus = function useTreeViewFocus(_ref) {
  var instance = _ref.instance,
    params = _ref.params,
    state = _ref.state,
    setState = _ref.setState,
    models = _ref.models,
    rootRef = _ref.rootRef;
  var setFocusedNodeId = useEventCallback(function (nodeId) {
    var cleanNodeId = typeof nodeId === 'function' ? nodeId(state.focusedNodeId) : nodeId;
    setState(function (prevState) {
      return _extends({}, prevState, {
        focusedNodeId: cleanNodeId
      });
    });
  });
  var isNodeFocused = React.useCallback(function (nodeId) {
    return state.focusedNodeId === nodeId;
  }, [state.focusedNodeId]);
  var focusNode = useEventCallback(function (event, nodeId) {
    if (nodeId) {
      setFocusedNodeId(nodeId);
      if (params.onNodeFocus) {
        params.onNodeFocus(event, nodeId);
      }
    }
  });
  populateInstance(instance, {
    isNodeFocused: isNodeFocused,
    focusNode: focusNode
  });
  useInstanceEventHandler(instance, 'removeNode', function (_ref2) {
    var id = _ref2.id;
    setFocusedNodeId(function (oldFocusedNodeId) {
      if (oldFocusedNodeId === id && rootRef.current === ownerDocument(rootRef.current).activeElement) {
        return instance.getChildrenIds(null)[0];
      }
      return oldFocusedNodeId;
    });
  });
  var createHandleFocus = function createHandleFocus(otherHandlers) {
    return function (event) {
      var _otherHandlers$onFocu;
      (_otherHandlers$onFocu = otherHandlers.onFocus) == null || _otherHandlers$onFocu.call(otherHandlers, event);

      // if the event bubbled (which is React specific) we don't want to steal focus
      if (event.target === event.currentTarget) {
        var isNodeVisible = function isNodeVisible(nodeId) {
          var node = instance.getNode(nodeId);
          return node && (node.parentId == null || instance.isNodeExpanded(node.parentId));
        };
        var nodeToFocusId;
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
  };
  var createHandleBlur = function createHandleBlur(otherHandlers) {
    return function (event) {
      var _otherHandlers$onBlur;
      (_otherHandlers$onBlur = otherHandlers.onBlur) == null || _otherHandlers$onBlur.call(otherHandlers, event);
      setFocusedNodeId(null);
    };
  };
  var focusedNode = instance.getNode(state.focusedNodeId);
  var activeDescendant = focusedNode ? focusedNode.idAttribute : null;
  return {
    getRootProps: function getRootProps(otherHandlers) {
      return {
        onFocus: createHandleFocus(otherHandlers),
        onBlur: createHandleBlur(otherHandlers),
        'aria-activedescendant': activeDescendant != null ? activeDescendant : undefined
      };
    }
  };
};
useTreeViewFocus.getInitialState = function () {
  return {
    focusedNodeId: null
  };
};
useTreeViewFocus.getDefaultizedParams = function (params) {
  var _params$disabledItems;
  return _extends({}, params, {
    disabledItemsFocusable: (_params$disabledItems = params.disabledItemsFocusable) != null ? _params$disabledItems : false
  });
};