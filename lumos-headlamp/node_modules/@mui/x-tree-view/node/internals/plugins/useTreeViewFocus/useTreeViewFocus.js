"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useTreeViewFocus = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var React = _interopRequireWildcard(require("react"));
var _useEventCallback = _interopRequireDefault(require("@mui/utils/useEventCallback"));
var _ownerDocument = _interopRequireDefault(require("@mui/utils/ownerDocument"));
var _useTreeView = require("../../useTreeView/useTreeView.utils");
var _useInstanceEventHandler = require("../../hooks/useInstanceEventHandler");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const useTreeViewFocus = ({
  instance,
  params,
  state,
  setState,
  models,
  rootRef
}) => {
  const setFocusedNodeId = (0, _useEventCallback.default)(nodeId => {
    const cleanNodeId = typeof nodeId === 'function' ? nodeId(state.focusedNodeId) : nodeId;
    setState(prevState => (0, _extends2.default)({}, prevState, {
      focusedNodeId: cleanNodeId
    }));
  });
  const isNodeFocused = React.useCallback(nodeId => state.focusedNodeId === nodeId, [state.focusedNodeId]);
  const focusNode = (0, _useEventCallback.default)((event, nodeId) => {
    if (nodeId) {
      setFocusedNodeId(nodeId);
      if (params.onNodeFocus) {
        params.onNodeFocus(event, nodeId);
      }
    }
  });
  (0, _useTreeView.populateInstance)(instance, {
    isNodeFocused,
    focusNode
  });
  (0, _useInstanceEventHandler.useInstanceEventHandler)(instance, 'removeNode', ({
    id
  }) => {
    setFocusedNodeId(oldFocusedNodeId => {
      if (oldFocusedNodeId === id && rootRef.current === (0, _ownerDocument.default)(rootRef.current).activeElement) {
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
exports.useTreeViewFocus = useTreeViewFocus;
useTreeViewFocus.getInitialState = () => ({
  focusedNodeId: null
});
useTreeViewFocus.getDefaultizedParams = params => (0, _extends2.default)({}, params, {
  disabledItemsFocusable: params.disabledItemsFocusable ?? false
});