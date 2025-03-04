'use client';

import _extends from "@babel/runtime/helpers/esm/extends";
import _objectWithoutProperties from "@babel/runtime/helpers/esm/objectWithoutProperties";
import * as React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { styled, useThemeProps } from '@mui/material/styles';
import { unstable_composeClasses as composeClasses } from '@mui/base';
import { getTabPanelUtilityClass } from './tabPanelClasses';
import { getPanelId, getTabId, useTabContext } from '../TabContext';
import { jsx as _jsx } from "react/jsx-runtime";
var useUtilityClasses = function useUtilityClasses(ownerState) {
  var classes = ownerState.classes;
  var slots = {
    root: ['root']
  };
  return composeClasses(slots, getTabPanelUtilityClass, classes);
};
var TabPanelRoot = styled('div', {
  name: 'MuiTabPanel',
  slot: 'Root',
  overridesResolver: function overridesResolver(props, styles) {
    return styles.root;
  }
})(function (_ref) {
  var theme = _ref.theme;
  return {
    padding: theme.spacing(3)
  };
});
var TabPanel = /*#__PURE__*/React.forwardRef(function TabPanel(inProps, ref) {
  var props = useThemeProps({
    props: inProps,
    name: 'MuiTabPanel'
  });
  var children = props.children,
    className = props.className,
    value = props.value,
    other = _objectWithoutProperties(props, ["children", "className", "value"]);
  var ownerState = _extends({}, props);
  var classes = useUtilityClasses(ownerState);
  var context = useTabContext();
  if (context === null) {
    throw new TypeError('No TabContext provided');
  }
  var id = getPanelId(context, value);
  var tabId = getTabId(context, value);
  return /*#__PURE__*/_jsx(TabPanelRoot, _extends({
    "aria-labelledby": tabId,
    className: clsx(classes.root, className),
    hidden: value !== context.value,
    id: id,
    ref: ref,
    role: "tabpanel",
    ownerState: ownerState
  }, other, {
    children: value === context.value && children
  }));
});
process.env.NODE_ENV !== "production" ? TabPanel.propTypes /* remove-proptypes */ = {
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
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object]),
  /**
   * The `value` of the corresponding `Tab`. Must use the index of the `Tab` when
   * no `value` was passed to `Tab`.
   */
  value: PropTypes.string.isRequired
} : void 0;
export default TabPanel;