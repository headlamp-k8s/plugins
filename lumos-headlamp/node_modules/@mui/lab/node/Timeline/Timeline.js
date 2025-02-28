"use strict";
'use client';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var _objectWithoutPropertiesLoose2 = _interopRequireDefault(require("@babel/runtime/helpers/objectWithoutPropertiesLoose"));
var React = _interopRequireWildcard(require("react"));
var _propTypes = _interopRequireDefault(require("prop-types"));
var _clsx = _interopRequireDefault(require("clsx"));
var _base = require("@mui/base");
var _styles = require("@mui/material/styles");
var _TimelineContext = _interopRequireDefault(require("./TimelineContext"));
var _timelineClasses = require("./timelineClasses");
var _convertTimelinePositionToClass = _interopRequireDefault(require("../internal/convertTimelinePositionToClass"));
var _jsxRuntime = require("react/jsx-runtime");
const _excluded = ["position", "className"];
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const useUtilityClasses = ownerState => {
  const {
    position,
    classes
  } = ownerState;
  const slots = {
    root: ['root', position && (0, _convertTimelinePositionToClass.default)(position)]
  };
  return (0, _base.unstable_composeClasses)(slots, _timelineClasses.getTimelineUtilityClass, classes);
};
const TimelineRoot = (0, _styles.styled)('ul', {
  name: 'MuiTimeline',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const {
      ownerState
    } = props;
    return [styles.root, ownerState.position && styles[(0, _convertTimelinePositionToClass.default)(ownerState.position)]];
  }
})({
  display: 'flex',
  flexDirection: 'column',
  padding: '6px 16px',
  flexGrow: 1
});

/**
 *
 * Demos:
 *
 * - [Timeline](https://mui.com/material-ui/react-timeline/)
 *
 * API:
 *
 * - [Timeline API](https://mui.com/material-ui/api/timeline/)
 */
const Timeline = /*#__PURE__*/React.forwardRef(function Timeline(inProps, ref) {
  const props = (0, _styles.useThemeProps)({
    props: inProps,
    name: 'MuiTimeline'
  });
  const {
      position = 'right',
      className
    } = props,
    other = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
  const ownerState = (0, _extends2.default)({}, props, {
    position
  });
  const classes = useUtilityClasses(ownerState);
  const contextValue = React.useMemo(() => ({
    position
  }), [position]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_TimelineContext.default.Provider, {
    value: contextValue,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(TimelineRoot, (0, _extends2.default)({
      className: (0, _clsx.default)(classes.root, className),
      ownerState: ownerState,
      ref: ref
    }, other))
  });
});
process.env.NODE_ENV !== "production" ? Timeline.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
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
   * className applied to the root element.
   */
  className: _propTypes.default.string,
  /**
   * The position where the TimelineContent should appear relative to the time axis.
   * @default 'right'
   */
  position: _propTypes.default.oneOf(['alternate-reverse', 'alternate', 'left', 'right']),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: _propTypes.default.oneOfType([_propTypes.default.arrayOf(_propTypes.default.oneOfType([_propTypes.default.func, _propTypes.default.object, _propTypes.default.bool])), _propTypes.default.func, _propTypes.default.object])
} : void 0;

/**
 *
 * Demos:
 *
 * - [Timeline](https://mui.com/components/timeline/)
 *
 * API:
 *
 * - [Timeline API](https://mui.com/api/timeline/)
 */
var _default = exports.default = Timeline;