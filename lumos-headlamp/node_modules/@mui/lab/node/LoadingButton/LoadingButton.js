"use strict";
'use client';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutPropertiesLoose"));
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var React = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _utils = require("@mui/utils");
var _utils2 = require("@mui/material/utils");
var _base = require("@mui/base");
var _styles = require("@mui/material/styles");
var _DefaultPropsProvider = require("@mui/material/DefaultPropsProvider");
var _Button = _interopRequireDefault(require("@mui/material/Button"));
var _ButtonGroup = require("@mui/material/ButtonGroup");
var _CircularProgress = _interopRequireDefault(require("@mui/material/CircularProgress"));
var _resolveProps = _interopRequireDefault(require("@mui/utils/resolveProps"));
var _loadingButtonClasses = _interopRequireWildcard(require("./loadingButtonClasses"));
var _jsxRuntime = require("react/jsx-runtime");
const _excluded = ["children", "disabled", "id", "loading", "loadingIndicator", "loadingPosition", "variant"];
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const useUtilityClasses = ownerState => {
  const {
    loading,
    loadingPosition,
    classes
  } = ownerState;
  const slots = {
    root: ['root', loading && 'loading'],
    startIcon: [loading && `startIconLoading${(0, _utils2.capitalize)(loadingPosition)}`],
    endIcon: [loading && `endIconLoading${(0, _utils2.capitalize)(loadingPosition)}`],
    loadingIndicator: ['loadingIndicator', loading && `loadingIndicator${(0, _utils2.capitalize)(loadingPosition)}`]
  };
  const composedClasses = (0, _base.unstable_composeClasses)(slots, _loadingButtonClasses.getLoadingButtonUtilityClass, classes);
  return (0, _extends2.default)({}, classes, composedClasses);
};

// TODO use `import { rootShouldForwardProp } from '../styles/styled';` once move to core
const rootShouldForwardProp = prop => prop !== 'ownerState' && prop !== 'theme' && prop !== 'sx' && prop !== 'as' && prop !== 'classes';
const LoadingButtonRoot = (0, _styles.styled)(_Button.default, {
  shouldForwardProp: prop => rootShouldForwardProp(prop) || prop === 'classes',
  name: 'MuiLoadingButton',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    return [styles.root, styles.startIconLoadingStart && {
      [`& .${_loadingButtonClasses.default.startIconLoadingStart}`]: styles.startIconLoadingStart
    }, styles.endIconLoadingEnd && {
      [`& .${_loadingButtonClasses.default.endIconLoadingEnd}`]: styles.endIconLoadingEnd
    }];
  }
})(({
  ownerState,
  theme
}) => (0, _extends2.default)({
  [`& .${_loadingButtonClasses.default.startIconLoadingStart}, & .${_loadingButtonClasses.default.endIconLoadingEnd}`]: {
    transition: theme.transitions.create(['opacity'], {
      duration: theme.transitions.duration.short
    }),
    opacity: 0
  }
}, ownerState.loadingPosition === 'center' && {
  transition: theme.transitions.create(['background-color', 'box-shadow', 'border-color'], {
    duration: theme.transitions.duration.short
  }),
  [`&.${_loadingButtonClasses.default.loading}`]: {
    color: 'transparent'
  }
}, ownerState.loadingPosition === 'start' && ownerState.fullWidth && {
  [`& .${_loadingButtonClasses.default.startIconLoadingStart}, & .${_loadingButtonClasses.default.endIconLoadingEnd}`]: {
    transition: theme.transitions.create(['opacity'], {
      duration: theme.transitions.duration.short
    }),
    opacity: 0,
    marginRight: -8
  }
}, ownerState.loadingPosition === 'end' && ownerState.fullWidth && {
  [`& .${_loadingButtonClasses.default.startIconLoadingStart}, & .${_loadingButtonClasses.default.endIconLoadingEnd}`]: {
    transition: theme.transitions.create(['opacity'], {
      duration: theme.transitions.duration.short
    }),
    opacity: 0,
    marginLeft: -8
  }
}));
const LoadingButtonLoadingIndicator = (0, _styles.styled)('span', {
  name: 'MuiLoadingButton',
  slot: 'LoadingIndicator',
  overridesResolver: (props, styles) => {
    const {
      ownerState
    } = props;
    return [styles.loadingIndicator, styles[`loadingIndicator${(0, _utils2.capitalize)(ownerState.loadingPosition)}`]];
  }
})(({
  theme,
  ownerState
}) => (0, _extends2.default)({
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
}));
const LoadingButton = /*#__PURE__*/React.forwardRef(function LoadingButton(inProps, ref) {
  const contextProps = React.useContext(_ButtonGroup.ButtonGroupContext);
  const resolvedProps = (0, _resolveProps.default)(contextProps, inProps);
  const props = (0, _DefaultPropsProvider.useDefaultProps)({
    props: resolvedProps,
    name: 'MuiLoadingButton'
  });
  const {
      children,
      disabled = false,
      id: idProp,
      loading = false,
      loadingIndicator: loadingIndicatorProp,
      loadingPosition = 'center',
      variant = 'text'
    } = props,
    other = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
  const id = (0, _utils2.unstable_useId)(idProp);
  const loadingIndicator = loadingIndicatorProp != null ? loadingIndicatorProp : /*#__PURE__*/(0, _jsxRuntime.jsx)(_CircularProgress.default, {
    "aria-labelledby": id,
    color: "inherit",
    size: 16
  });
  const ownerState = (0, _extends2.default)({}, props, {
    disabled,
    loading,
    loadingIndicator,
    loadingPosition,
    variant
  });
  const classes = useUtilityClasses(ownerState);
  const loadingButtonLoadingIndicator = loading ? /*#__PURE__*/(0, _jsxRuntime.jsx)(LoadingButtonLoadingIndicator, {
    className: classes.loadingIndicator,
    ownerState: ownerState,
    children: loadingIndicator
  }) : null;
  return /*#__PURE__*/(0, _jsxRuntime.jsxs)(LoadingButtonRoot, (0, _extends2.default)({
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
  children: _propTypes.default.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: _propTypes.default.object,
  /**
   * If `true`, the component is disabled.
   * @default false
   */
  disabled: _propTypes.default.bool,
  /**
   * @ignore
   */
  id: _propTypes.default.string,
  /**
   * If `true`, the loading indicator is shown and the button becomes disabled.
   * @default false
   */
  loading: _propTypes.default.bool,
  /**
   * Element placed before the children if the button is in loading state.
   * The node should contain an element with `role="progressbar"` with an accessible name.
   * By default we render a `CircularProgress` that is labelled by the button itself.
   * @default <CircularProgress color="inherit" size={16} />
   */
  loadingIndicator: _propTypes.default.node,
  /**
   * The loading indicator can be positioned on the start, end, or the center of the button.
   * @default 'center'
   */
  loadingPosition: (0, _utils.chainPropTypes)(_propTypes.default.oneOf(['start', 'end', 'center']), props => {
    if (props.loadingPosition === 'start' && !props.startIcon) {
      return new Error(`MUI: The loadingPosition="start" should be used in combination with startIcon.`);
    }
    if (props.loadingPosition === 'end' && !props.endIcon) {
      return new Error(`MUI: The loadingPosition="end" should be used in combination with endIcon.`);
    }
    return null;
  }),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: _propTypes.default.oneOfType([_propTypes.default.arrayOf(_propTypes.default.oneOfType([_propTypes.default.func, _propTypes.default.object, _propTypes.default.bool])), _propTypes.default.func, _propTypes.default.object]),
  /**
   * The variant to use.
   * @default 'text'
   */
  variant: _propTypes.default /* @typescript-to-proptypes-ignore */.oneOfType([_propTypes.default.oneOf(['contained', 'outlined', 'text']), _propTypes.default.string])
} : void 0;
var _default = exports.default = LoadingButton;