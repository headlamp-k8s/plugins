'use client';

import _objectWithoutProperties from "@babel/runtime/helpers/esm/objectWithoutProperties";
import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { styled, useThemeProps } from '@mui/material/styles';
import { unstable_composeClasses as composeClasses } from '@mui/base';
import Typography from '@mui/material/Typography';
import TimelineContext from '../Timeline/TimelineContext';
import { getTimelineOppositeContentUtilityClass } from './timelineOppositeContentClasses';
import convertTimelinePositionToClass from '../internal/convertTimelinePositionToClass';
import { jsx as _jsx } from "react/jsx-runtime";
var useUtilityClasses = function useUtilityClasses(ownerState) {
  var position = ownerState.position,
    classes = ownerState.classes;
  var slots = {
    root: ['root', convertTimelinePositionToClass(position)]
  };
  return composeClasses(slots, getTimelineOppositeContentUtilityClass, classes);
};
var TimelineOppositeContentRoot = styled(Typography, {
  name: 'MuiTimelineOppositeContent',
  slot: 'Root',
  overridesResolver: function overridesResolver(props, styles) {
    var ownerState = props.ownerState;
    return [styles.root, styles[convertTimelinePositionToClass(ownerState.position)]];
  }
})(function (_ref) {
  var ownerState = _ref.ownerState;
  return _extends({
    padding: '6px 16px',
    marginRight: 'auto',
    textAlign: 'right',
    flex: 1
  }, ownerState.position === 'left' && {
    textAlign: 'left'
  });
});
var TimelineOppositeContent = /*#__PURE__*/React.forwardRef(function TimelineOppositeContent(inProps, ref) {
  var props = useThemeProps({
    props: inProps,
    name: 'MuiTimelineOppositeContent'
  });
  var className = props.className,
    other = _objectWithoutProperties(props, ["className"]);
  var _React$useContext = React.useContext(TimelineContext),
    positionContext = _React$useContext.position;
  var ownerState = _extends({}, props, {
    position: positionContext || 'left'
  });
  var classes = useUtilityClasses(ownerState);
  return /*#__PURE__*/_jsx(TimelineOppositeContentRoot, _extends({
    component: "div",
    className: clsx(classes.root, className),
    ownerState: ownerState,
    ref: ref
  }, other));
});
process.env.NODE_ENV !== "production" ? TimelineOppositeContent.propTypes /* remove-proptypes */ = {
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
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object])
} : void 0;
TimelineOppositeContent.muiName = 'TimelineOppositeContent';
export default TimelineOppositeContent;