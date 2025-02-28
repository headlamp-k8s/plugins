'use client';

import _objectWithoutProperties from "@babel/runtime/helpers/esm/objectWithoutProperties";
import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { styled, useThemeProps } from '@mui/material/styles';
import { capitalize } from '@mui/material/utils';
import { unstable_composeClasses as composeClasses } from '@mui/base';
import { getTimelineDotUtilityClass } from './timelineDotClasses';
import { jsx as _jsx } from "react/jsx-runtime";
var useUtilityClasses = function useUtilityClasses(ownerState) {
  var color = ownerState.color,
    variant = ownerState.variant,
    classes = ownerState.classes;
  var slots = {
    root: ['root', variant, color !== 'inherit' && "".concat(variant).concat(capitalize(color))]
  };
  return composeClasses(slots, getTimelineDotUtilityClass, classes);
};
var TimelineDotRoot = styled('span', {
  name: 'MuiTimelineDot',
  slot: 'Root',
  overridesResolver: function overridesResolver(props, styles) {
    var ownerState = props.ownerState;
    return [styles.root, styles[ownerState.color !== 'inherit' && "".concat(ownerState.variant).concat(capitalize(ownerState.color))], styles[ownerState.variant]];
  }
})(function (_ref) {
  var ownerState = _ref.ownerState,
    theme = _ref.theme;
  return _extends({
    display: 'flex',
    alignSelf: 'baseline',
    borderStyle: 'solid',
    borderWidth: 2,
    padding: 4,
    borderRadius: '50%',
    boxShadow: (theme.vars || theme).shadows[1],
    margin: '11.5px 0'
  }, ownerState.variant === 'filled' && _extends({
    borderColor: 'transparent'
  }, ownerState.color !== 'inherit' && _extends({}, ownerState.color === 'grey' ? {
    color: (theme.vars || theme).palette.grey[50],
    backgroundColor: (theme.vars || theme).palette.grey[400]
  } : {
    color: (theme.vars || theme).palette[ownerState.color].contrastText,
    backgroundColor: (theme.vars || theme).palette[ownerState.color].main
  })), ownerState.variant === 'outlined' && _extends({
    boxShadow: 'none',
    backgroundColor: 'transparent'
  }, ownerState.color !== 'inherit' && _extends({}, ownerState.color === 'grey' ? {
    borderColor: (theme.vars || theme).palette.grey[400]
  } : {
    borderColor: (theme.vars || theme).palette[ownerState.color].main
  })));
});
var TimelineDot = /*#__PURE__*/React.forwardRef(function TimelineDot(inProps, ref) {
  var props = useThemeProps({
    props: inProps,
    name: 'MuiTimelineDot'
  });
  var className = props.className,
    _props$color = props.color,
    color = _props$color === void 0 ? 'grey' : _props$color,
    _props$variant = props.variant,
    variant = _props$variant === void 0 ? 'filled' : _props$variant,
    other = _objectWithoutProperties(props, ["className", "color", "variant"]);
  var ownerState = _extends({}, props, {
    color: color,
    variant: variant
  });
  var classes = useUtilityClasses(ownerState);
  return /*#__PURE__*/_jsx(TimelineDotRoot, _extends({
    className: clsx(classes.root, className),
    ownerState: ownerState,
    ref: ref
  }, other));
});
process.env.NODE_ENV !== "production" ? TimelineDot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │    To update them, edit the d.ts file and run `pnpm proptypes`.     │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The content of the component.
   */
  children: PropTypes.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: PropTypes.object,
  /**
   * @ignore
   */
  className: PropTypes.string,
  /**
   * The dot can have a different colors.
   * @default 'grey'
   */
  color: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['error', 'grey', 'info', 'inherit', 'primary', 'secondary', 'success', 'warning']), PropTypes.string]),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object]),
  /**
   * The dot can appear filled or outlined.
   * @default 'filled'
   */
  variant: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['filled', 'outlined']), PropTypes.string])
} : void 0;
export default TimelineDot;