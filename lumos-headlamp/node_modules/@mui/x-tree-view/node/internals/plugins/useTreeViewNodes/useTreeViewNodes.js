"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useTreeViewNodes = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var React = _interopRequireWildcard(require("react"));
var _useEventCallback = _interopRequireDefault(require("@mui/utils/useEventCallback"));
var _useTreeView = require("../../useTreeView/useTreeView.utils");
var _publishTreeViewEvent = require("../../utils/publishTreeViewEvent");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const useTreeViewNodes = ({
  instance,
  params
}) => {
  const nodeMap = React.useRef({});
  const getNode = React.useCallback(nodeId => nodeMap.current[nodeId], []);
  const insertNode = React.useCallback(node => {
    nodeMap.current[node.id] = node;
  }, []);
  const removeNode = React.useCallback(nodeId => {
    const newMap = (0, _extends2.default)({}, nodeMap.current);
    delete newMap[nodeId];
    nodeMap.current = newMap;
    (0, _publishTreeViewEvent.publishTreeViewEvent)(instance, 'removeNode', {
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
  const getChildrenIds = (0, _useEventCallback.default)(nodeId => Object.values(nodeMap.current).filter(node => node.parentId === nodeId).sort((a, b) => a.index - b.index).map(child => child.id));
  const getNavigableChildrenIds = nodeId => {
    let childrenIds = instance.getChildrenIds(nodeId);
    if (!params.disabledItemsFocusable) {
      childrenIds = childrenIds.filter(node => !instance.isNodeDisabled(node));
    }
    return childrenIds;
  };
  (0, _useTreeView.populateInstance)(instance, {
    getNode,
    updateNode: insertNode,
    removeNode,
    getChildrenIds,
    getNavigableChildrenIds,
    isNodeDisabled
  });
};
exports.useTreeViewNodes = useTreeViewNodes;