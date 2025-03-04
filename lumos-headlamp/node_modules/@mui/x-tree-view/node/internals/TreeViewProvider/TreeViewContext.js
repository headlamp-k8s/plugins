"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TreeViewContext = exports.DEFAULT_TREE_VIEW_CONTEXT_VALUE = void 0;
var React = _interopRequireWildcard(require("react"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const DEFAULT_TREE_VIEW_CONTEXT_VALUE = exports.DEFAULT_TREE_VIEW_CONTEXT_VALUE = {
  instance: null,
  multiSelect: false,
  disabledItemsFocusable: false,
  treeId: undefined,
  icons: {
    defaultCollapseIcon: null,
    defaultExpandIcon: null,
    defaultParentIcon: null,
    defaultEndIcon: null
  }
};

/**
 * @ignore - internal component.
 */
const TreeViewContext = exports.TreeViewContext = /*#__PURE__*/React.createContext(DEFAULT_TREE_VIEW_CONTEXT_VALUE);
if (process.env.NODE_ENV !== 'production') {
  TreeViewContext.displayName = 'TreeViewContext';
}