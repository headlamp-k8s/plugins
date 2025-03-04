import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
import _objectWithoutProperties from "@babel/runtime/helpers/esm/objectWithoutProperties";
import _extends from "@babel/runtime/helpers/esm/extends";
import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";
var _excluded = ["children", "className", "collapseIcon", "ContentComponent", "ContentProps", "endIcon", "expandIcon", "disabled", "icon", "id", "label", "nodeId", "onClick", "onMouseDown", "TransitionComponent", "TransitionProps"];
import * as React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import Collapse from '@mui/material/Collapse';
import { alpha, styled, useThemeProps } from '@mui/material/styles';
import ownerDocument from '@mui/utils/ownerDocument';
import useForkRef from '@mui/utils/useForkRef';
import unsupportedProp from '@mui/utils/unsupportedProp';
import elementTypeAcceptingRef from '@mui/utils/elementTypeAcceptingRef';
import { unstable_composeClasses as composeClasses } from '@mui/base';
import { DescendantProvider, useDescendant } from '../internals/TreeViewProvider/DescendantProvider';
import { TreeItemContent } from './TreeItemContent';
import { treeItemClasses, getTreeItemUtilityClass } from './treeItemClasses';
import { useTreeViewContext } from '../internals/TreeViewProvider/useTreeViewContext';
import { jsx as _jsx } from "react/jsx-runtime";
import { jsxs as _jsxs } from "react/jsx-runtime";
var useUtilityClasses = function useUtilityClasses(ownerState) {
  var classes = ownerState.classes;
  var slots = {
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
  return composeClasses(slots, getTreeItemUtilityClass, classes);
};
var TreeItemRoot = styled('li', {
  name: 'MuiTreeItem',
  slot: 'Root',
  overridesResolver: function overridesResolver(props, styles) {
    return styles.root;
  }
})({
  listStyle: 'none',
  margin: 0,
  padding: 0,
  outline: 0
});
var StyledTreeItemContent = styled(TreeItemContent, {
  name: 'MuiTreeItem',
  slot: 'Content',
  overridesResolver: function overridesResolver(props, styles) {
    return [styles.content, styles.iconContainer && _defineProperty({}, "& .".concat(treeItemClasses.iconContainer), styles.iconContainer), styles.label && _defineProperty({}, "& .".concat(treeItemClasses.label), styles.label)];
  }
})(function (_ref3) {
  var _ref4;
  var theme = _ref3.theme;
  return _ref4 = {
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
    }
  }, _defineProperty(_ref4, "&.".concat(treeItemClasses.disabled), {
    opacity: (theme.vars || theme).palette.action.disabledOpacity,
    backgroundColor: 'transparent'
  }), _defineProperty(_ref4, "&.".concat(treeItemClasses.focused), {
    backgroundColor: (theme.vars || theme).palette.action.focus
  }), _defineProperty(_ref4, "&.".concat(treeItemClasses.selected), _defineProperty({
    backgroundColor: theme.vars ? "rgba(".concat(theme.vars.palette.primary.mainChannel, " / ").concat(theme.vars.palette.action.selectedOpacity, ")") : alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
    '&:hover': {
      backgroundColor: theme.vars ? "rgba(".concat(theme.vars.palette.primary.mainChannel, " / calc(").concat(theme.vars.palette.action.selectedOpacity, " + ").concat(theme.vars.palette.action.hoverOpacity, "))") : alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity + theme.palette.action.hoverOpacity),
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {
        backgroundColor: theme.vars ? "rgba(".concat(theme.vars.palette.primary.mainChannel, " / ").concat(theme.vars.palette.action.selectedOpacity, ")") : alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity)
      }
    }
  }, "&.".concat(treeItemClasses.focused), {
    backgroundColor: theme.vars ? "rgba(".concat(theme.vars.palette.primary.mainChannel, " / calc(").concat(theme.vars.palette.action.selectedOpacity, " + ").concat(theme.vars.palette.action.focusOpacity, "))") : alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity + theme.palette.action.focusOpacity)
  })), _defineProperty(_ref4, "& .".concat(treeItemClasses.iconContainer), {
    marginRight: 4,
    width: 15,
    display: 'flex',
    flexShrink: 0,
    justifyContent: 'center',
    '& svg': {
      fontSize: 18
    }
  }), _defineProperty(_ref4, "& .".concat(treeItemClasses.label), _extends({
    paddingLeft: 4,
    width: '100%',
    boxSizing: 'border-box',
    // prevent width + padding to overflow
    // fixes overflow - see https://github.com/mui/material-ui/issues/27372
    minWidth: 0,
    position: 'relative'
  }, theme.typography.body1)), _ref4;
});
var TreeItemGroup = styled(Collapse, {
  name: 'MuiTreeItem',
  slot: 'Group',
  overridesResolver: function overridesResolver(props, styles) {
    return styles.group;
  }
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
export var TreeItem = /*#__PURE__*/React.forwardRef(function TreeItem(inProps, ref) {
  var props = useThemeProps({
    props: inProps,
    name: 'MuiTreeItem'
  });
  var children = props.children,
    className = props.className,
    collapseIcon = props.collapseIcon,
    _props$ContentCompone = props.ContentComponent,
    ContentComponent = _props$ContentCompone === void 0 ? TreeItemContent : _props$ContentCompone,
    ContentProps = props.ContentProps,
    endIcon = props.endIcon,
    expandIcon = props.expandIcon,
    disabledProp = props.disabled,
    icon = props.icon,
    idProp = props.id,
    label = props.label,
    nodeId = props.nodeId,
    onClick = props.onClick,
    onMouseDown = props.onMouseDown,
    _props$TransitionComp = props.TransitionComponent,
    TransitionComponent = _props$TransitionComp === void 0 ? Collapse : _props$TransitionComp,
    TransitionProps = props.TransitionProps,
    other = _objectWithoutProperties(props, _excluded);
  var _useTreeViewContext = useTreeViewContext(),
    contextIcons = _useTreeViewContext.icons,
    multiSelect = _useTreeViewContext.multiSelect,
    disabledItemsFocusable = _useTreeViewContext.disabledItemsFocusable,
    treeId = _useTreeViewContext.treeId,
    instance = _useTreeViewContext.instance;
  var id;
  if (idProp != null) {
    id = idProp;
  } else if (treeId && nodeId) {
    id = "".concat(treeId, "-").concat(nodeId);
  }
  var _React$useState = React.useState(null),
    _React$useState2 = _slicedToArray(_React$useState, 2),
    treeItemElement = _React$useState2[0],
    setTreeItemElement = _React$useState2[1];
  var contentRef = React.useRef(null);
  var handleRef = useForkRef(setTreeItemElement, ref);
  var descendant = React.useMemo(function () {
    return {
      element: treeItemElement,
      id: nodeId
    };
  }, [nodeId, treeItemElement]);
  var _useDescendant = useDescendant(descendant),
    index = _useDescendant.index,
    parentId = _useDescendant.parentId;
  var expandable = Boolean(Array.isArray(children) ? children.length : children);
  var expanded = instance ? instance.isNodeExpanded(nodeId) : false;
  var focused = instance ? instance.isNodeFocused(nodeId) : false;
  var selected = instance ? instance.isNodeSelected(nodeId) : false;
  var disabled = instance ? instance.isNodeDisabled(nodeId) : false;
  var ownerState = _extends({}, props, {
    expanded: expanded,
    focused: focused,
    selected: selected,
    disabled: disabled
  });
  var classes = useUtilityClasses(ownerState);
  var displayIcon;
  var expansionIcon;
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
  React.useEffect(function () {
    // On the first render a node's index will be -1. We want to wait for the real index.
    if (instance && index !== -1) {
      instance.updateNode({
        id: nodeId,
        idAttribute: id,
        index: index,
        parentId: parentId,
        expandable: expandable,
        disabled: disabledProp
      });
      return function () {
        return instance.removeNode(nodeId);
      };
    }
    return undefined;
  }, [instance, parentId, index, nodeId, expandable, disabledProp, id]);
  React.useEffect(function () {
    if (instance && label) {
      var _contentRef$current$t, _contentRef$current;
      return instance.mapFirstChar(nodeId, ((_contentRef$current$t = (_contentRef$current = contentRef.current) == null ? void 0 : _contentRef$current.textContent) != null ? _contentRef$current$t : '').substring(0, 1).toLowerCase());
    }
    return undefined;
  }, [instance, nodeId, label]);
  var ariaSelected;
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
      var rootElement;
      if (typeof event.target.getRootNode === 'function') {
        rootElement = event.target.getRootNode();
      } else {
        rootElement = ownerDocument(event.target);
      }
      rootElement.getElementById(treeId).focus({
        preventScroll: true
      });
    }
    var unfocusable = !disabledItemsFocusable && disabled;
    if (instance && !focused && event.currentTarget === event.target && !unfocusable) {
      instance.focusNode(event, nodeId);
    }
  }
  return /*#__PURE__*/_jsxs(TreeItemRoot, _extends({
    className: clsx(classes.root, className),
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
    children: [/*#__PURE__*/_jsx(StyledTreeItemContent, _extends({
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
    }, ContentProps)), children && /*#__PURE__*/_jsx(DescendantProvider, {
      id: nodeId,
      children: /*#__PURE__*/_jsx(TreeItemGroup, _extends({
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
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * className applied to the root element.
   */
  className: PropTypes.string,
  /**
   * The icon used to collapse the node.
   */
  collapseIcon: PropTypes.node,
  /**
   * The component used for the content node.
   * @default TreeItemContent
   */
  ContentComponent: elementTypeAcceptingRef,
  /**
   * Props applied to ContentComponent.
   */
  ContentProps: PropTypes.object,
  /**
   * If `true`, the node is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * The icon displayed next to an end node.
   */
  endIcon: PropTypes.node,
  /**
   * The icon used to expand the node.
   */
  expandIcon: PropTypes.node,
  /**
   * The icon to display next to the tree node's label.
   */
  icon: PropTypes.node,
  /**
   * The tree node label.
   */
  label: PropTypes.node,
  /**
   * The id of the node.
   */
  nodeId: PropTypes.string.isRequired,
  /**
   * This prop isn't supported.
   * Use the `onNodeFocus` callback on the tree if you need to monitor a node's focus.
   */
  onFocus: unsupportedProp,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object]),
  /**
   * The component used for the transition.
   * [Follow this guide](/material-ui/transitions/#transitioncomponent-prop) to learn more about the requirements for this component.
   * @default Collapse
   */
  TransitionComponent: PropTypes.elementType,
  /**
   * Props applied to the transition element.
   * By default, the element is based on this [`Transition`](http://reactcommunity.org/react-transition-group/transition/) component.
   */
  TransitionProps: PropTypes.object
} : void 0;