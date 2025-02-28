"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TreeItemContent = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutPropertiesLoose"));
var React = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _clsx = _interopRequireDefault(require("clsx"));
var _useTreeItem = require("./useTreeItem");
var _jsxRuntime = require("react/jsx-runtime");
const _excluded = ["classes", "className", "displayIcon", "expansionIcon", "icon", "label", "nodeId", "onClick", "onMouseDown"];
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/**
 * @ignore - internal component.
 */
const TreeItemContent = exports.TreeItemContent = /*#__PURE__*/React.forwardRef(function TreeItemContent(props, ref) {
  const {
      classes,
      className,
      displayIcon,
      expansionIcon,
      icon: iconProp,
      label,
      nodeId,
      onClick,
      onMouseDown
    } = props,
    other = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
  const {
    disabled,
    expanded,
    selected,
    focused,
    handleExpansion,
    handleSelection,
    preventSelection
  } = (0, _useTreeItem.useTreeItem)(nodeId);
  const icon = iconProp || expansionIcon || displayIcon;
  const handleMouseDown = event => {
    preventSelection(event);
    if (onMouseDown) {
      onMouseDown(event);
    }
  };
  const handleClick = event => {
    handleExpansion(event);
    handleSelection(event);
    if (onClick) {
      onClick(event);
    }
  };
  return (
    /*#__PURE__*/
    /* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions -- Key event is handled by the TreeView */
    (0, _jsxRuntime.jsxs)("div", (0, _extends2.default)({}, other, {
      className: (0, _clsx.default)(className, classes.root, expanded && classes.expanded, selected && classes.selected, focused && classes.focused, disabled && classes.disabled),
      onClick: handleClick,
      onMouseDown: handleMouseDown,
      ref: ref,
      children: [/*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: classes.iconContainer,
        children: icon
      }), /*#__PURE__*/(0, _jsxRuntime.jsx)("div", {
        className: classes.label,
        children: label
      })]
    }))
  );
});
process.env.NODE_ENV !== "production" ? TreeItemContent.propTypes = {
  // ----------------------------- Warning --------------------------------
  // | These PropTypes are generated from the TypeScript type definitions |
  // | To update them edit the TypeScript types and run "yarn proptypes"  |
  // ----------------------------------------------------------------------
  /**
   * Override or extend the styles applied to the component.
   */
  classes: _propTypes.default.object.isRequired,
  /**
   * className applied to the root element.
   */
  className: _propTypes.default.string,
  /**
   * The icon to display next to the tree node's label. Either a parent or end icon.
   */
  displayIcon: _propTypes.default.node,
  /**
   * The icon to display next to the tree node's label. Either an expansion or collapse icon.
   */
  expansionIcon: _propTypes.default.node,
  /**
   * The icon to display next to the tree node's label.
   */
  icon: _propTypes.default.node,
  /**
   * The tree node label.
   */
  label: _propTypes.default.node,
  /**
   * The id of the node.
   */
  nodeId: _propTypes.default.string.isRequired
} : void 0;