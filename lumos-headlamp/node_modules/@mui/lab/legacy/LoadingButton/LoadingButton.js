'use client';

import _objectWithoutProperties from "@babel/runtime/helpers/esm/objectWithoutProperties";
import _defineProperty from "@babel/runtime/helpers/esm/defineProperty";
import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import PropTypes from 'prop-types';
import { chainPropTypes } from '@mui/utils';
import { capitalize, unstable_useId as useId } from '@mui/material/utils';
import { unstable_composeClasses as composeClasses } from '@mui/base';
import { styled } from '@mui/material/styles';
import { useDefaultProps } from '@mui/material/DefaultPropsProvider';
import Button from '@mui/material/Button';
import { ButtonGroupContext } from '@mui/material/ButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import resolveProps from '@mui/utils/resolveProps';
import loadingButtonClasses, { getLoadingButtonUtilityClass } from './loadingButtonClasses';
import { jsx as _jsx } from "react/jsx-runtime";
import { jsxs as _jsxs } from "react/jsx-runtime";
var useUtilityClasses = function useUtilityClasses(ownerState) {
  var loading = ownerState.loading,
    loadingPosition = ownerState.loadingPosition,
    classes = ownerState.classes;
  var slots = {
    root: ['root', loading && 'loading'],
    startIcon: [loading && "startIconLoading".concat(capitalize(loadingPosition))],
    endIcon: [loading && "endIconLoading".concat(capitalize(loadingPosition))],
    loadingIndicator: ['loadingIndicator', loading && "loadingIndicator".concat(capitalize(loadingPosition))]
  };
  var composedClasses = composeClasses(slots, getLoadingButtonUtilityClass, classes);
  return _extends({}, classes, composedClasses);
};

// TODO use `import { rootShouldForwardProp } from '../styles/styled';` once move to core
var rootShouldForwardProp = function rootShouldForwardProp(prop) {
  return prop !== 'ownerState' && prop !== 'theme' && prop !== 'sx' && prop !== 'as' && prop !== 'classes';
};
var LoadingButtonRoot = styled(Button, {
  shouldForwardProp: function shouldForwardProp(prop) {
    return rootShouldForwardProp(prop) || prop === 'classes';
  },
  name: 'MuiLoadingButton',
  slot: 'Root',
  overridesResolver: function overridesResolver(props, styles) {
    return [styles.root, styles.startIconLoadingStart && _defineProperty({}, "& .".concat(loadingButtonClasses.startIconLoadingStart), styles.startIconLoadingStart), styles.endIconLoadingEnd && _defineProperty({}, "& .".concat(loadingButtonClasses.endIconLoadingEnd), styles.endIconLoadingEnd)];
  }
})(function (_ref3) {
  var ownerState = _ref3.ownerState,
    theme = _ref3.theme;
  return _extends(_defineProperty({}, "& .".concat(loadingButtonClasses.startIconLoadingStart, ", & .").concat(loadingButtonClasses.endIconLoadingEnd), {
    transition: theme.transitions.create(['opacity'], {
      duration: theme.transitions.duration.short
    }),
    opacity: 0
  }), ownerState.loadingPosition === 'center' && _defineProperty({
    transition: theme.transitions.create(['background-color', 'box-shadow', 'border-color'], {
      duration: theme.transitions.duration.short
    })
  }, "&.".concat(loadingButtonClasses.loading), {
    color: 'transparent'
  }), ownerState.loadingPosition === 'start' && ownerState.fullWidth && _defineProperty({}, "& .".concat(loadingButtonClasses.startIconLoadingStart, ", & .").concat(loadingButtonClasses.endIconLoadingEnd), {
    transition: theme.transitions.create(['opacity'], {
      duration: theme.transitions.duration.short
    }),
    opacity: 0,
    marginRight: -8
  }), ownerState.loadingPosition === 'end' && ownerState.fullWidth && _defineProperty({}, "& .".concat(loadingButtonClasses.startIconLoadingStart, ", & .").concat(loadingButtonClasses.endIconLoadingEnd), {
    transition: theme.transitions.create(['opacity'], {
      duration: theme.transitions.duration.short
    }),
    opacity: 0,
    marginLeft: -8
  }));
});
var LoadingButtonLoadingIndicator = styled('span', {
  name: 'MuiLoadingButton',
  slot: 'LoadingIndicator',
  overridesResolver: function overridesResolver(props, styles) {
    var ownerState = props.ownerState;
    return [styles.loadingIndicator, styles["loadingIndicator".concat(capitalize(ownerState.loadingPosition))]];
  }
})(function (_ref7) {
  var theme = _ref7.theme,
    ownerState = _ref7.ownerState;
  return _extends({
    position: 'absolute',
    visibility: 'visible',
    display: 'flex'
  }, ownerState.loadingPosition === 'start' && (ownerState.variant === 'outlined' || ownerState.variant === 'contained') && {
    left: ownerState.size === 'small' ? 10 : 14
  }, ownerState.loadingPosition === 'start' && ownerState.variant === 'text' && {
    left: 6
  }, ownerState.loadingPosition === 'center' && {
    left: '50%',
    transform: 'translate(-50%)',
    color: (theme.vars || theme).palette.action.disabled
  }, ownerState.loadingPosition === 'end' && (ownerState.variant === 'outlined' || ownerState.variant === 'contained') && {
    right: ownerState.size === 'small' ? 10 : 14
  }, ownerState.loadingPosition === 'end' && ownerState.variant === 'text' && {
    right: 6
  }, ownerState.loadingPosition === 'start' && ownerState.fullWidth && {
    position: 'relative',
    left: -10
  }, ownerState.loadingPosition === 'end' && ownerState.fullWidth && {
    position: 'relative',
    right: -10
  });
});
var LoadingButton = /*#__PURE__*/React.forwardRef(function LoadingButton(inProps, ref) {
  var contextProps = React.useContext(ButtonGroupContext);
  var resolvedProps = resolveProps(contextProps, inProps);
  var props = useDefaultProps({
    props: resolvedProps,
    name: 'MuiLoadingButton'
  });
  var children = props.children,
    _props$disabled = props.disabled,
    disabled = _props$disabled === void 0 ? false : _props$disabled,
    idProp = props.id,
    _props$loading = props.loading,
    loading = _props$loading === void 0 ? false : _props$loading,
    loadingIndicatorProp = props.loadingIndicator,
    _props$loadingPositio = props.loadingPosition,
    loadingPosition = _props$loadingPositio === void 0 ? 'center' : _props$loadingPositio,
    _props$variant = props.variant,
    variant = _props$variant === void 0 ? 'text' : _props$variant,
    other = _objectWithoutProperties(props, ["children", "disabled", "id", "loading", "loadingIndicator", "loadingPosition", "variant"]);
  var id = useId(idProp);
  var loadingIndicator = loadingIndicatorProp != null ? loadingIndicatorProp : /*#__PURE__*/_jsx(CircularProgress, {
    "aria-labelledby": id,
    color: "inherit",
    size: 16
  });
  var ownerState = _extends({}, props, {
    disabled: disabled,
    loading: loading,
    loadingIndicator: loadingIndicator,
    loadingPosition: loadingPosition,
    variant: variant
  });
  var classes = useUtilityClasses(ownerState);
  var loadingButtonLoadingIndicator = loading ? /*#__PURE__*/_jsx(LoadingButtonLoadingIndicator, {
    className: classes.loadingIndicator,
    ownerState: ownerState,
    children: loadingIndicator
  }) : null;
  return /*#__PURE__*/_jsxs(LoadingButtonRoot, _extends({
    disabled: disabled || loading,
    id: id,
    ref: ref
  }, other, {
    variant: variant,
    classes: classes,
    ownerState: ownerState,
    children: [ownerState.loadingPosition === 'end' ? children : loadingButtonLoadingIndicator, ownerState.loadingPosition === 'end' ? loadingButtonLoadingIndicator : children]
  }));
});
process.env.NODE_ENV !== "production" ? LoadingButton.propTypes /* remove-proptypes */ = {
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
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * @ignore
   */
  id: PropTypes.string,
  /**
   * If `true`, the loading indicator is shown and the button becomes disabled.
   * @default false
   */
  loading: PropTypes.bool,
  /**
   * Element placed before the children if the button is in loading state.
   * The node should contain an element with `role="progressbar"` with an accessible name.
   * By default we render a `CircularProgress` that is labelled by the button itself.
   * @default <CircularProgress color="inherit" size={16} />
   */
  loadingIndicator: PropTypes.node,
  /**
   * The loading indicator can be positioned on the start, end, or the center of the button.
   * @default 'center'
   */
  loadingPosition: chainPropTypes(PropTypes.oneOf(['start', 'end', 'center']), function (props) {
    if (props.loadingPosition === 'start' && !props.startIcon) {
      return new Error("MUI: The loadingPosition=\"start\" should be used in combination with startIcon.");
    }
    if (props.loadingPosition === 'end' && !props.endIcon) {
      return new Error("MUI: The loadingPosition=\"end\" should be used in combination with endIcon.");
    }
    return null;
  }),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])), PropTypes.func, PropTypes.object]),
  /**
   * The variant to use.
   * @default 'text'
   */
  variant: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([PropTypes.oneOf(['contained', 'outlined', 'text']), PropTypes.string])
} : void 0;
export default LoadingButton;