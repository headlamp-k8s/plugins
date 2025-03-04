"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.TreeItem = void 0;
var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutPropertiesLoose"));
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var React = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _clsx = _interopRequireDefault(require("clsx"));
var _Collapse = _interopRequireDefault(require("@mui/material/Collapse"));
var _styles = require("@mui/material/styles");
var _ownerDocument = _interopRequireDefault(require("@mui/utils/ownerDocument"));
var _useForkRef = _interopRequireDefault(require("@mui/utils/useForkRef"));
var _unsupportedProp = _interopRequireDefault(require("@mui/utils/unsupportedProp"));
var _elementTypeAcceptingRef = _interopRequireDefault(require("@mui/utils/elementTypeAcceptingRef"));
var _base = require("@mui/base");
var _DescendantProvider = require("../internals/TreeViewProvider/DescendantProvider");
var _TreeItemContent = require("./TreeItemContent");
var _treeItemClasses = require("./treeItemClasses");
var _useTreeViewContext = require("../internals/TreeViewProvider/useTreeViewContext");
var _jsxRuntime = require("react/jsx-runtime");
const _excluded = ["children", "className", "collapseIcon", "ContentComponent", "ContentProps", "endIcon", "expandIcon", "disabled", "icon", "id", "label", "nodeId", "onClick", "onMouseDown", "TransitionComponent", "TransitionProps"];
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const useUtilityClasses = ownerState => {
  const {
    classes
  } = ownerState;
  const slots = {
    root: ['root'],
    content: ['content'],
    expanded: ['expanded'],
    selected: ['selected'],
    focused: ['focused'],
    disabled: ['disabled'],
    iconContainer: ['iconContainer'],
    label: ['label'],
    group: ['group']
  };
  return (0, _base.unstable_composeClasses)(slots, _treeItemClasses.getTreeItemUtilityClass, classes);
};
const TreeItemRoot = (0, _styles.styled)('li', {
  name: 'MuiTreeItem',
  slot: 'Root',
  overridesResolver: (props, styles) => styles.root
})({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  outline: 0
});
const StyledTreeItemContent = (0, _styles.styled)(_TreeItemContent.TreeItemContent, {
  name: 'MuiTreeItem',
  slot: 'Content',
  overridesResolver: (props, styles) => {
    return [styles.content, styles.iconContainer && {
      [`& .${_treeItemClasses.treeItemClasses.iconContainer}`]: styles.iconContainer
    }, styles.label && {
      [`& .${_treeItemClasses.treeItemClasses.label}`]: styles.label
    }];
  }
})(({
  theme
}) => ({
  padding: '0 8px',
  width: '100%',
  boxSizing: 'border-box',
  // prevent width + padding to overflow
  display: 'flex',
  alignItems: 'center',
  cursor: 'pointer',
  WebkitTapHighlightColor: 'transparent',
  '&:hover': {
    backgroundColor: (theme.vars || theme).palette.action.hover,
    // Reset on touch devices, it doesn't add specificity
    '@media (hover: none)': {
      backgroundColor: 'transparent'
    }
  },
  [`&.${_treeItemClasses.treeItemClasses.disabled}`]: {
    opacity: (theme.vars || theme).palette.action.disabledOpacity,
    backgroundColor: 'transparent'
  },
  [`&.${_treeItemClasses.treeItemClasses.focused}`]: {
    backgroundColor: (theme.vars || theme).palette.action.focus
  },
  [`&.${_treeItemClasses.treeItemClasses.selected}`]: {
    backgroundColor: theme.vars ? `rgba(${theme.vars.palette.primary.mainChannel} / ${theme.vars.palette.action.selectedOpacity})` : (0, _styles.alpha)(theme.palette.primary.main, theme.palette.action.selectedOpacity),
    '&:hover': {
      backgroundColor: theme.vars ? `rgba(${theme.vars.palette.primary.mainChannel} / calc(${theme.vars.palette.action.selectedOpacity} + ${theme.vars.palette.action.hoverOpacity}))` : (0, _styles.alpha)(theme.palette.primary.main, theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity),
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: theme.vars ? `rgba(${theme.vars.palette.primary.mainChannel} / ${theme.vars.palette.action.selectedOpacity})` : (0, _styles.alpha)(theme.palette.primary.main, theme.palette.action.selectedOpacity)
      }
    },
    [`&.${_treeItemClasses.treeItemClasses.focused}`]: {
      backgroundColor: theme.vars ? `rgba(${theme.vars.palette.primary.mainChannel} / calc(${theme.vars.palette.action.selectedOpacity} + ${theme.vars.palette.action.focusOpacity}))` : (0, _styles.alpha)(theme.palette.primary.main, theme.palette.action.selectedOpacity + theme.palette.action.focusOpacity)
    }
  },
  [`& .${_treeItemClasses.treeItemClasses.iconContainer}`]: {
    marginRight: 4,
    width: 15,
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    '& svg': {
      fontSize: 18
    }
  },
  [`& .${_treeItemClasses.treeItemClasses.label}`]: (0, _extends2.default)({
    paddingLeft: 4,
    width: '100%',
    boxSizing: 'border-box',
    // prevent width + padding to overflow
    // fixes overflow - see https://github.com/mui/material-ui/issues/27372
    minWidth: 0,
    position: 'relative'
  }, theme.typography.body1)
}));
const TreeItemGroup = (0, _styles.styled)(_Collapse.default, {
  name: 'MuiTreeItem',
  slot: 'Group',
  overridesResolver: (props, styles) => styles.group
})({
  margin: 0,
  padding: 0,
  marginLeft: 17
});

/**
 *
 * Demos:
 *
 * - [Tree View](https://mui.com/x/react-tree-view/)
 *
 * API:
 *
 * - [TreeItem API](https://mui.com/x/api/tree-view/tree-item/)
 */
const TreeItem = exports.TreeItem = /*#__PURE__*/React.forwardRef(function TreeItem(inProps, ref) {
  const props = (0, _styles.useThemeProps)({
    props: inProps,
    name: 'MuiTreeItem'
  });
  const {
      children,
      className,
      collapseIcon,
      ContentComponent = _TreeItemContent.TreeItemContent,
      ContentProps,
      endIcon,
      expandIcon,
      disabled: disabledProp,
      icon,
      id: idProp,
      label,
      nodeId,
      onClick,
      onMouseDown,
      TransitionComponent = _Collapse.default,
      TransitionProps
    } = props,
    other = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
  const {
    icons: contextIcons,
    multiSelect,
    disabledItemsFocusable,
    treeId,
    instance
  } = (0, _useTreeViewContext.useTreeViewContext)();
  let id;
  if (idProp != null) {
    id = idProp;
  } else if (treeId && nodeId) {
    id = `${treeId}-${nodeId}`;
  }
  const [treeItemElement, setTreeItemElement] = React.useState(null);
  const contentRef = React.useRef(null);
  const handleRef = (0, _useForkRef.default)(setTreeItemElement, ref);
  const descendant = React.useMemo(() => ({
    element: treeItemElement,
    id: nodeId
  }), [nodeId, treeItemElement]);
  const {
    index,
    parentId
  } = (0, _DescendantProvider.useDescendant)(descendant);
  const expandable = Boolean(Array.isArray(children) ? children.length : children);
  const expanded = instance ? instance.isNodeExpanded(nodeId) : false;
  const focused = instance ? instance.isNodeFocused(nodeId) : false;
  const selected = instance ? instance.isNodeSelected(nodeId) : false;
  const disabled = instance ? instance.isNodeDisabled(nodeId) : false;
  const ownerState = (0, _extends2.default)({}, props, {
    expanded,
    focused,
    selected,
    disabled
  });
  const classes = useUtilityClasses(ownerState);
  let displayIcon;
  let expansionIcon;
  if (expandable) {
    if (!expanded) {
      expansionIcon = expandIcon || contextIcons.defaultExpandIcon;
    } else {
      expansionIcon = collapseIcon || contextIcons.defaultCollapseIcon;
    }
  }
  if (expandable) {
    displayIcon = contextIcons.defaultParentIcon;
  } else {
    displayIcon = endIcon || contextIcons.defaultEndIcon;
  }
  React.useEffect(() => {
    // On the first render a node's index will be -1. We want to wait for the real index.
    if (instance && index !== -1) {
      instance.updateNode({
        id: nodeId,
        idAttribute: id,
        index,
        parentId,
        expandable,
        disabled: disabledProp
      });
      return () => instance.removeNode(nodeId);
    }
    return undefined;
  }, [instance, parentId, index, nodeId, expandable, disabledProp, id]);
  React.useEffect(() => {
    if (instance && label) {
      return instance.mapFirstChar(nodeId, (contentRef.current?.textContent ?? '').substring(0, 1).toLowerCase());
    }
    return undefined;
  }, [instance, nodeId, label]);
  let ariaSelected;
  if (multiSelect) {
    ariaSelected = selected;
  } else if (selected) {
    /* single-selection trees unset aria-selected on un-selected items.
     *
     * If the tree does not support multiple selection, aria-selected
     * is set to true for the selected node and it is not present on any other node in the tree.
     * Source: https://www.w3.org/WAI/ARIA/apg/patterns/treeview/
     */
    ariaSelected = true;
  }
  function handleFocus(event) {
    // DOM focus stays on the tree which manages focus with aria-activedescendant
    if (event.target === event.currentTarget) {
      let rootElement;
      if (typeof event.target.getRootNode === 'function') {
        rootElement = event.target.getRootNode();
      } else {
        rootElement = (0, _ownerDocument.default)(event.target);
      }
      rootElement.getElementById(treeId).focus({
        preventScroll: true
      });
    }
    const unfocusable = !disabledItemsFocusable && disabled;
    if (instance && !focused && event.currentTarget === event.target && !unfocusable) {
      instance.focusNode(event, nodeId);
    }
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(TreeItemRoot, (0, _extends2.default)({
    className: (0, _clsx.default)(classes.root, className),
    role: "treeitem",
    "aria-expanded": expandable ? expanded : undefined,
    "aria-selected": ariaSelected,
    "aria-disabled": disabled || undefined,
    id: id,
    tabIndex: -1
  }, other, {
    ownerState: ownerState,
    onFocus: handleFocus,
    ref: handleRef,
    children: [/*#__PURE__*/(0, _jsxRuntime.jsx)(StyledTreeItemContent, (0, _extends2.default)({
      as: ContentComponent,
      ref: contentRef,
      classes: {
        root: classes.content,
        expanded: classes.expanded,
        selected: classes.selected,
        focused: classes.focused,
        disabled: classes.disabled,
        iconContainer: classes.iconContainer,
        label: classes.label
      },
      label: label,
      nodeId: nodeId,
      onClick: onClick,
      onMouseDown: onMouseDown,
      icon: icon,
      expansionIcon: expansionIcon,
      displayIcon: displayIcon,
      ownerState: ownerState
    }, ContentProps)), children && /*#__PURE__*/(0, _jsxRuntime.jsx)(_DescendantProvider.DescendantProvider, {
      id: nodeId,
      children: /*#__PURE__*/(0, _jsxRuntime.jsx)(TreeItemGroup, (0, _extends2.default)({
        as: TransitionComponent,
        unmountOnExit: true,
        className: classes.group,
        in: expanded,
        component: "ul",
        role: "group"
      }, TransitionProps, {
        children: children
      }))
    })]
  }));
});
process.env.NODE_ENV !== "production" ? TreeItem.propTypes = {
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
   * The icon used to collapse the node.
   */
  collapseIcon: _propTypes.default.node,
  /**
   * The component used for the content node.
   * @default TreeItemContent
   */
  ContentComponent: _elementTypeAcceptingRef.default,
  /**
   * Props applied to ContentComponent.
   */
  ContentProps: _propTypes.default.object,
  /**
   * If `true`, the node is disabled.
   * @default false
   */
  disabled: _propTypes.default.bool,
  /**
   * The icon displayed next to an end node.
   */
  endIcon: _propTypes.default.node,
  /**
   * The icon used to expand the node.
   */
  expandIcon: _propTypes.default.node,
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
  nodeId: _propTypes.default.string.isRequired,
  /**
   * This prop isn't supported.
   * Use the `onNodeFocus` callback on the tree if you need to monitor a node's focus.
   */
  onFocus: _unsupportedProp.default,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: _propTypes.default.oneOfType([_propTypes.default.arrayOf(_propTypes.default.oneOfType([_propTypes.default.func, _propTypes.default.object, _propTypes.default.bool])), _propTypes.default.func, _propTypes.default.object]),
  /**
   * The component used for the transition.
   * [Follow this guide](/material-ui/transitions/#transitioncomponent-prop) to learn more about the requirements for this component.
   * @default Collapse
   */
  TransitionComponent: _propTypes.default.elementType,
  /**
   * Props applied to the transition element.
   * By default, the element is based on this [`Transition`](http://reactcommunity.org/react-transition-group/transition/) component.
   */
  TransitionProps: _propTypes.default.object
} : void 0;