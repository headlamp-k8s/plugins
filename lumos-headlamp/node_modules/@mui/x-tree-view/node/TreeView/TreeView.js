"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TreeView = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutPropertiesLoose"));
var React = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _styles = require("@mui/material/styles");
var _composeClasses = _interopRequireDefault(require("@mui/utils/composeClasses"));
var _utils = require("@mui/base/utils");
var _treeViewClasses = require("./treeViewClasses");
var _useTreeView = require("../internals/useTreeView");
var _TreeViewProvider = require("../internals/TreeViewProvider");
var _plugins = require("../internals/plugins");
var _jsxRuntime = require("react/jsx-runtime");
const _excluded = ["disabledItemsFocusable", "expanded", "defaultExpanded", "onNodeToggle", "onNodeFocus", "disableSelection", "defaultSelected", "selected", "multiSelect", "onNodeSelect", "id", "defaultCollapseIcon", "defaultEndIcon", "defaultExpandIcon", "defaultParentIcon", "children"];
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const useUtilityClasses = ownerState => {
  const {
    classes
  } = ownerState;
  const slots = {
    root: ['root']
  };
  return (0, _composeClasses.default)(slots, _treeViewClasses.getTreeViewUtilityClass, classes);
};
const TreeViewRoot = (0, _styles.styled)('ul', {
  name: 'MuiTreeView',
  slot: 'Root',
  overridesResolver: (props, styles) => styles.root
})({
  padding: 0,
  margin: 0,
  listStyle: 'none',
  outline: 0
});
/**
 *
 * Demos:
 *
 * - [Tree View](https://mui.com/x/react-tree-view/)
 *
 * API:
 *
 * - [TreeView API](https://mui.com/x/api/tree-view/tree-view/)
 */
const TreeView = exports.TreeView = /*#__PURE__*/React.forwardRef(function TreeView(inProps, ref) {
  const themeProps = (0, _styles.useThemeProps)({
    props: inProps,
    name: 'MuiTreeView'
  });
  const ownerState = themeProps;
  const _ref = themeProps,
    {
      // Headless implementation
      disabledItemsFocusable,
      expanded,
      defaultExpanded,
      onNodeToggle,
      onNodeFocus,
      disableSelection,
      defaultSelected,
      selected,
      multiSelect,
      onNodeSelect,
      id,
      defaultCollapseIcon,
      defaultEndIcon,
      defaultExpandIcon,
      defaultParentIcon,
      // Component implementation
      children
    } = _ref,
    other = (0, _objectWithoutPropertiesLoose2.default)(_ref, _excluded);
  const {
    getRootProps,
    contextValue
  } = (0, _useTreeView.useTreeView)({
    disabledItemsFocusable,
    expanded,
    defaultExpanded,
    onNodeToggle,
    onNodeFocus,
    disableSelection,
    defaultSelected,
    selected,
    multiSelect,
    onNodeSelect,
    id,
    defaultCollapseIcon,
    defaultEndIcon,
    defaultExpandIcon,
    defaultParentIcon,
    plugins: _plugins.DEFAULT_TREE_VIEW_PLUGINS,
    rootRef: ref
  });
  const classes = useUtilityClasses(themeProps);
  const rootProps = (0, _utils.useSlotProps)({
    elementType: TreeViewRoot,
    externalSlotProps: {},
    externalForwardedProps: other,
    className: classes.root,
    getSlotProps: getRootProps,
    ownerState
  });
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_TreeViewProvider.TreeViewProvider, {
    value: contextValue,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(TreeViewRoot, (0, _extends2.default)({}, rootProps, {
      children: children
    }))
  });
});
process.env.NODE_ENV !== "production" ? TreeView.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  /**
   * The content of the component.
   */
  children: _propTypes.default.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: _propTypes.default.object,
  /**
   * className applied to the root element.
   */
  className: _propTypes.default.string,
  /**
   * The default icon used to collapse the node.
   */
  defaultCollapseIcon: _propTypes.default.node,
  /**
   * The default icon displayed next to a end node. This is applied to all
   * tree nodes and can be overridden by the TreeItem `icon` prop.
   */
  defaultEndIcon: _propTypes.default.node,
  /**
   * Expanded node ids.
   * Used when the item's expansion is not controlled.
   * @default []
   */
  defaultExpanded: _propTypes.default.arrayOf(_propTypes.default.string),
  /**
   * The default icon used to expand the node.
   */
  defaultExpandIcon: _propTypes.default.node,
  /**
   * The default icon displayed next to a parent node. This is applied to all
   * parent nodes and can be overridden by the TreeItem `icon` prop.
   */
  defaultParentIcon: _propTypes.default.node,
  /**
   * Selected node ids. (Uncontrolled)
   * When `multiSelect` is true this takes an array of strings; when false (default) a string.
   * @default []
   */
  defaultSelected: _propTypes.default /* @typescript-to-proptypes-ignore */.oneOfType([_propTypes.default.arrayOf(_propTypes.default.string), _propTypes.default.string]),
  /**
   * If `true`, will allow focus on disabled items.
   * @default false
   */
  disabledItemsFocusable: _propTypes.default.bool,
  /**
   * If `true` selection is disabled.
   * @default false
   */
  disableSelection: _propTypes.default.bool,
  /**
   * Expanded node ids.
   * Used when the item's expansion is controlled.
   */
  expanded: _propTypes.default.arrayOf(_propTypes.default.string),
  /**
   * This prop is used to help implement the accessibility logic.
   * If you don't provide this prop. It falls back to a randomly generated id.
   */
  id: _propTypes.default.string,
  /**
   * If true `ctrl` and `shift` will trigger multiselect.
   * @default false
   */
  multiSelect: _propTypes.default.bool,
  /**
   * Callback fired when tree items are focused.
   * @param {React.SyntheticEvent} event The event source of the callback **Warning**: This is a generic event not a focus event.
   * @param {string} nodeId The id of the node focused.
   * @param {string} value of the focused node.
   */
  onNodeFocus: _propTypes.default.func,
  /**
   * Callback fired when tree items are selected/unselected.
   * @param {React.SyntheticEvent} event The event source of the callback
   * @param {string[] | string} nodeIds Ids of the selected nodes. When `multiSelect` is true
   * this is an array of strings; when false (default) a string.
   */
  onNodeSelect: _propTypes.default.func,
  /**
   * Callback fired when tree items are expanded/collapsed.
   * @param {React.SyntheticEvent} event The event source of the callback.
   * @param {array} nodeIds The ids of the expanded nodes.
   */
  onNodeToggle: _propTypes.default.func,
  /**
   * Selected node ids. (Controlled)
   * When `multiSelect` is true this takes an array of strings; when false (default) a string.
   */
  selected: _propTypes.default.any,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: _propTypes.default.oneOfType([_propTypes.default.arrayOf(_propTypes.default.oneOfType([_propTypes.default.func, _propTypes.default.object, _propTypes.default.bool])), _propTypes.default.func, _propTypes.default.object])
} : void 0;