"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useTreeViewExpansion = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var React = _interopRequireWildcard(require("react"));
var _useEventCallback = _interopRequireDefault(require("@mui/utils/useEventCallback"));
var _useTreeView = require("../../useTreeView/useTreeView.utils");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const useTreeViewExpansion = ({
  instance,
  params,
  models
}) => {
  const isNodeExpanded = React.useCallback(nodeId => {
    return Array.isArray(models.expanded.value) ? models.expanded.value.indexOf(nodeId) !== -1 : false;
  }, [models.expanded.value]);
  const isNodeExpandable = React.useCallback(nodeId => !!instance.getNode(nodeId)?.expandable, [instance]);
  const toggleNodeExpansion = (0, _useEventCallback.default)((event, nodeId) => {
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
  (0, _useTreeView.populateInstance)(instance, {
    isNodeExpanded,
    isNodeExpandable,
    toggleNodeExpansion,
    expandAllSiblings
  });
};
exports.useTreeViewExpansion = useTreeViewExpansion;
useTreeViewExpansion.models = {
  expanded: {
    controlledProp: 'expanded',
    defaultProp: 'defaultExpanded'
  }
};
const DEFAULT_EXPANDED = [];
useTreeViewExpansion.getDefaultizedParams = params => (0, _extends2.default)({}, params, {
  defaultExpanded: params.defaultExpanded ?? DEFAULT_EXPANDED
});