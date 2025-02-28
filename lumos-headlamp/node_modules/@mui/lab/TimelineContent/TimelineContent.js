'use client';

import _objectWithoutPropertiesLoose from "@babel/runtime/helpers/esm/objectWithoutPropertiesLoose";
import _extends from "@babel/runtime/helpers/esm/extends";
const _excluded = ["className"];
import * as React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { styled, useThemeProps } from '@mui/material/styles';
import { unstable_composeClasses as composeClasses } from '@mui/base';
import Typography from '@mui/material/Typography';
import TimelineContext from '../Timeline/TimelineContext';
import { getTimelineContentUtilityClass } from './timelineContentClasses';
import convertTimelinePositionToClass from '../internal/convertTimelinePositionToClass';
import { jsx as _jsx } from "react/jsx-runtime";
const useUtilityClasses = ownerState => {
  const {
    position,
    classes
  } = ownerState;
  const slots = {
    root: ['root', convertTimelinePositionToClass(position)]
  };
  return composeClasses(slots, getTimelineContentUtilityClass, classes);
};
const TimelineContentRoot = styled(Typography, {
  name: 'MuiTimelineContent',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const {
      ownerState
    } = props;
    return [styles.root, styles[convertTimelinePositionToClass(ownerState.position)]];
  }
})(({
  ownerState
}) => _extends({
  flex: 1,
  padding: '6px 16px',
  textAlign: 'left'
}, ownerState.position === 'left' && {
  textAlign: 'right'
}));
const TimelineContent = /*#__PURE__*/React.forwardRef(function TimelineContent(inProps, ref) {
  const props = useThemeProps({
    props: inProps,
    name: 'MuiTimelineContent'
  });
  const {
      className
    } = props,
    other = _objectWithoutPropertiesLoose(props, _excluded);
  const {
    position: positionContext
  } = React.useContext(TimelineContext);
  const ownerState = _extends({}, props, {
    position: positionContext || 'right'
  });
  const classes = useUtilityClasses(ownerState);
  return /*#__PURE__*/_jsx(TimelineContentRoot, _extends({
    component: "div",
    className: clsx(classes.root, className),
    ownerState: ownerState,
    ref: ref
  }, other));
});
process.env.NODE_ENV !== "production" ? TimelineContent.propTypes /* remove-proptypes */ = {
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
export default TimelineContent;