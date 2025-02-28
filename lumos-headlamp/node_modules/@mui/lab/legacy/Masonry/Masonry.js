'use client';

import _toConsumableArray from "@babel/runtime/helpers/esm/toConsumableArray";
import _objectWithoutProperties from "@babel/runtime/helpers/esm/objectWithoutProperties";
import _typeof from "@babel/runtime/helpers/esm/typeof";
import _extends from "@babel/runtime/helpers/esm/extends";
import { unstable_composeClasses as composeClasses } from '@mui/base';
import * as ReactDOM from 'react-dom';
import { styled } from '@mui/material/styles';
import { useDefaultProps } from '@mui/material/DefaultPropsProvider';
import { createUnarySpacing, getValue, handleBreakpoints, unstable_resolveBreakpointValues as resolveBreakpointValues } from '@mui/system';
import { deepmerge, unstable_useForkRef as useForkRef, unstable_useEnhancedEffect as useEnhancedEffect } from '@mui/utils';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import * as React from 'react';
import { getMasonryUtilityClass } from './masonryClasses';
import { jsx as _jsx } from "react/jsx-runtime";
import { jsxs as _jsxs } from "react/jsx-runtime";
export var parseToNumber = function parseToNumber(val) {
  return Number(val.replace('px', ''));
};
var lineBreakStyle = {
  flexBasis: '100%',
  width: 0,
  margin: 0,
  padding: 0
};
var useUtilityClasses = function useUtilityClasses(ownerState) {
  var classes = ownerState.classes;
  var slots = {
    root: ['root']
  };
  return composeClasses(slots, getMasonryUtilityClass, classes);
};
export var getStyle = function getStyle(_ref) {
  var ownerState = _ref.ownerState,
    theme = _ref.theme;
  var styles = {
    width: '100%',
    display: 'flex',
    flexFlow: 'column wrap',
    alignContent: 'flex-start',
    boxSizing: 'border-box',
    '& > *': {
      boxSizing: 'border-box'
    }
  };
  var stylesSSR = {};
  // Only applicable for Server-Side Rendering
  if (ownerState.isSSR) {
    var orderStyleSSR = {};
    var defaultSpacing = parseToNumber(theme.spacing(ownerState.defaultSpacing));
    for (var i = 1; i <= ownerState.defaultColumns; i += 1) {
      orderStyleSSR["&:nth-of-type(".concat(ownerState.defaultColumns, "n+").concat(i % ownerState.defaultColumns, ")")] = {
        order: i
      };
    }
    stylesSSR.height = ownerState.defaultHeight;
    stylesSSR.margin = -(defaultSpacing / 2);
    stylesSSR['& > *'] = _extends({}, styles['& > *'], orderStyleSSR, {
      margin: defaultSpacing / 2,
      width: "calc(".concat((100 / ownerState.defaultColumns).toFixed(2), "% - ").concat(defaultSpacing, "px)")
    });
    return _extends({}, styles, stylesSSR);
  }
  var spacingValues = resolveBreakpointValues({
    values: ownerState.spacing,
    breakpoints: theme.breakpoints.values
  });
  var transformer = createUnarySpacing(theme);
  var spacingStyleFromPropValue = function spacingStyleFromPropValue(propValue) {
    var spacing;
    // in case of string/number value
    if (typeof propValue === 'string' && !Number.isNaN(Number(propValue)) || typeof propValue === 'number') {
      var themeSpacingValue = Number(propValue);
      spacing = getValue(transformer, themeSpacingValue);
    } else {
      spacing = propValue;
    }
    return _extends({
      margin: "calc(0px - (".concat(spacing, " / 2))"),
      '& > *': {
        margin: "calc(".concat(spacing, " / 2)")
      }
    }, ownerState.maxColumnHeight && {
      height: typeof spacing === 'number' ? Math.ceil(ownerState.maxColumnHeight + parseToNumber(spacing)) : "calc(".concat(ownerState.maxColumnHeight, "px + ").concat(spacing, ")")
    });
  };
  styles = deepmerge(styles, handleBreakpoints({
    theme: theme
  }, spacingValues, spacingStyleFromPropValue));
  var columnValues = resolveBreakpointValues({
    values: ownerState.columns,
    breakpoints: theme.breakpoints.values
  });
  var columnStyleFromPropValue = function columnStyleFromPropValue(propValue) {
    var columnValue = Number(propValue);
    var width = "".concat((100 / columnValue).toFixed(2), "%");
    var spacing = typeof spacingValues === 'string' && !Number.isNaN(Number(spacingValues)) || typeof spacingValues === 'number' ? getValue(transformer, Number(spacingValues)) : '0px';
    return {
      '& > *': {
        width: "calc(".concat(width, " - ").concat(spacing, ")")
      }
    };
  };
  styles = deepmerge(styles, handleBreakpoints({
    theme: theme
  }, columnValues, columnStyleFromPropValue));

  // configure width for responsive spacing values
  if (_typeof(spacingValues) === 'object') {
    styles = deepmerge(styles, handleBreakpoints({
      theme: theme
    }, spacingValues, function (propValue, breakpoint) {
      if (breakpoint) {
        var themeSpacingValue = Number(propValue);
        var lastBreakpoint = Object.keys(columnValues).pop();
        var spacing = getValue(transformer, themeSpacingValue);
        var column = _typeof(columnValues) === 'object' ? columnValues[breakpoint] || columnValues[lastBreakpoint] : columnValues;
        var width = "".concat((100 / column).toFixed(2), "%");
        return {
          '& > *': {
            width: "calc(".concat(width, " - ").concat(spacing, ")")
          }
        };
      }
      return null;
    }));
  }
  return styles;
};
var MasonryRoot = styled('div', {
  name: 'MuiMasonry',
  slot: 'Root',
  overridesResolver: function overridesResolver(props, styles) {
    return [styles.root];
  }
})(getStyle);
var Masonry = /*#__PURE__*/React.forwardRef(function Masonry(inProps, ref) {
  var props = useDefaultProps({
    props: inProps,
    name: 'MuiMasonry'
  });
  var children = props.children,
    className = props.className,
    _props$component = props.component,
    component = _props$component === void 0 ? 'div' : _props$component,
    _props$columns = props.columns,
    columns = _props$columns === void 0 ? 4 : _props$columns,
    _props$spacing = props.spacing,
    spacing = _props$spacing === void 0 ? 1 : _props$spacing,
    _props$sequential = props.sequential,
    sequential = _props$sequential === void 0 ? false : _props$sequential,
    defaultColumns = props.defaultColumns,
    defaultHeight = props.defaultHeight,
    defaultSpacing = props.defaultSpacing,
    other = _objectWithoutProperties(props, ["children", "className", "component", "columns", "spacing", "sequential", "defaultColumns", "defaultHeight", "defaultSpacing"]);
  var masonryRef = React.useRef();
  var _React$useState = React.useState(),
    maxColumnHeight = _React$useState[0],
    setMaxColumnHeight = _React$useState[1];
  var isSSR = !maxColumnHeight && defaultHeight && defaultColumns !== undefined && defaultSpacing !== undefined;
  var _React$useState2 = React.useState(isSSR ? defaultColumns - 1 : 0),
    numberOfLineBreaks = _React$useState2[0],
    setNumberOfLineBreaks = _React$useState2[1];
  var ownerState = _extends({}, props, {
    spacing: spacing,
    columns: columns,
    maxColumnHeight: maxColumnHeight,
    defaultColumns: defaultColumns,
    defaultHeight: defaultHeight,
    defaultSpacing: defaultSpacing,
    isSSR: isSSR
  });
  var classes = useUtilityClasses(ownerState);
  var handleResize = React.useCallback(function (masonryChildren) {
    if (!masonryRef.current || !masonryChildren || masonryChildren.length === 0) {
      return;
    }
    var masonry = masonryRef.current;
    var masonryFirstChild = masonryRef.current.firstChild;
    var parentWidth = masonry.clientWidth;
    var firstChildWidth = masonryFirstChild.clientWidth;
    if (parentWidth === 0 || firstChildWidth === 0) {
      return;
    }
    var firstChildComputedStyle = window.getComputedStyle(masonryFirstChild);
    var firstChildMarginLeft = parseToNumber(firstChildComputedStyle.marginLeft);
    var firstChildMarginRight = parseToNumber(firstChildComputedStyle.marginRight);
    var currentNumberOfColumns = Math.round(parentWidth / (firstChildWidth + firstChildMarginLeft + firstChildMarginRight));
    var columnHeights = new Array(currentNumberOfColumns).fill(0);
    var skip = false;
    var nextOrder = 1;
    masonry.childNodes.forEach(function (child) {
      if (child.nodeType !== Node.ELEMENT_NODE || child.dataset.class === 'line-break' || skip) {
        return;
      }
      var childComputedStyle = window.getComputedStyle(child);
      var childMarginTop = parseToNumber(childComputedStyle.marginTop);
      var childMarginBottom = parseToNumber(childComputedStyle.marginBottom);
      // if any one of children isn't rendered yet, masonry's height shouldn't be computed yet
      var childHeight = parseToNumber(childComputedStyle.height) ? Math.ceil(parseToNumber(childComputedStyle.height)) + childMarginTop + childMarginBottom : 0;
      if (childHeight === 0) {
        skip = true;
        return;
      }
      // if there is a nested image that isn't rendered yet, masonry's height shouldn't be computed yet
      for (var i = 0; i < child.childNodes.length; i += 1) {
        var nestedChild = child.childNodes[i];
        if (nestedChild.tagName === 'IMG' && nestedChild.clientHeight === 0) {
          skip = true;
          break;
        }
      }
      if (!skip) {
        if (sequential) {
          columnHeights[nextOrder - 1] += childHeight;
          child.style.order = nextOrder;
          nextOrder += 1;
          if (nextOrder > currentNumberOfColumns) {
            nextOrder = 1;
          }
        } else {
          // find the current shortest column (where the current item will be placed)
          var currentMinColumnIndex = columnHeights.indexOf(Math.min.apply(Math, _toConsumableArray(columnHeights)));
          columnHeights[currentMinColumnIndex] += childHeight;
          var order = currentMinColumnIndex + 1;
          child.style.order = order;
        }
      }
    });
    if (!skip) {
      // In React 18, state updates in a ResizeObserver's callback are happening after the paint which causes flickering
      // when doing some visual updates in it. Using flushSync ensures that the dom will be painted after the states updates happen
      // Related issue - https://github.com/facebook/react/issues/24331
      ReactDOM.flushSync(function () {
        setMaxColumnHeight(Math.max.apply(Math, _toConsumableArray(columnHeights)));
        setNumberOfLineBreaks(currentNumberOfColumns > 0 ? currentNumberOfColumns - 1 : 0);
      });
    }
  }, [sequential]);
  useEnhancedEffect(function () {
    // IE and old browsers are not supported
    if (typeof ResizeObserver === 'undefined') {
      return undefined;
    }
    var animationFrame;
    var resizeObserver = new ResizeObserver(function () {
      // see https://github.com/mui/material-ui/issues/36909
      animationFrame = requestAnimationFrame(handleResize);
    });
    if (masonryRef.current) {
      masonryRef.current.childNodes.forEach(function (childNode) {
        resizeObserver.observe(childNode);
      });
    }
    return function () {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
      }
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [columns, spacing, children, handleResize]);
  var handleRef = useForkRef(ref, masonryRef);

  //  columns are likely to have different heights and hence can start to merge;
  //  a line break at the end of each column prevents columns from merging
  var lineBreaks = new Array(numberOfLineBreaks).fill('').map(function (_, index) {
    return /*#__PURE__*/_jsx("span", {
      "data-class": "line-break",
      style: _extends({}, lineBreakStyle, {
        order: index + 1
      })
    }, index);
  });
  return /*#__PURE__*/_jsxs(MasonryRoot, _extends({
    as: component,
    className: clsx(classes.root, className),
    ref: handleRef,
    ownerState: ownerState
  }, other, {
    children: [children, lineBreaks]
  }));
});
process.env.NODE_ENV !== "production" ? Masonry.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component.
   */
  children: PropTypes /* @typescript-to-proptypes-ignore */.node.isRequired,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * Number of columns.
   * @default 4
   */
  columns: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])), PropTypes.number, PropTypes.object, PropTypes.string]),
  /**
   * The component used for the root node.
   * Either a string to use a HTML element or a component.
   */
  component: PropTypes.elementType,
  /**
   * The default number of columns of the component. This is provided for server-side rendering.
   */
  defaultColumns: PropTypes.number,
  /**
   * The default height of the component in px. This is provided for server-side rendering.
   */
  defaultHeight: PropTypes.number,
  /**
   * The default spacing of the component. Like `spacing`, it is a factor of the theme's spacing. This is provided for server-side rendering.
   */
  defaultSpacing: PropTypes.number,
  /**
   * Allows using sequential order rather than adding to shortest column
   * @default false
   */
  sequential: PropTypes.bool,
  /**
   * Defines the space between children. It is a factor of the theme's spacing.
   * @default 1
   */
  spacing: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string])), PropTypes.number, PropTypes.object, PropTypes.string]),
  /**
   * Allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object])
} : void 0;
export default Masonry;