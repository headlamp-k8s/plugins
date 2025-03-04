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
var _clsx = _interopRequireDefault(require("clsx"));
var _styles = require("@mui/material/styles");
var _base = require("@mui/base");
var _Typography = _interopRequireDefault(require("@mui/material/Typography"));
var _TimelineContext = _interopRequireDefault(require("../Timeline/TimelineContext"));
var _timelineContentClasses = require("./timelineContentClasses");
var _convertTimelinePositionToClass = _interopRequireDefault(require("../internal/convertTimelinePositionToClass"));
var _jsxRuntime = require("react/jsx-runtime");
const _excluded = ["className"];
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const useUtilityClasses = ownerState => {
  const {
    position,
    classes
  } = ownerState;
  const slots = {
    root: ['root', (0, _convertTimelinePositionToClass.default)(position)]
  };
  return (0, _base.unstable_composeClasses)(slots, _timelineContentClasses.getTimelineContentUtilityClass, classes);
};
const TimelineContentRoot = (0, _styles.styled)(_Typography.default, {
  name: 'MuiTimelineContent',
  slot: 'Root',
  overridesResolver: (props, styles) => {
    const {
      ownerState
    } = props;
    return [styles.root, styles[(0, _convertTimelinePositionToClass.default)(ownerState.position)]];
  }
})(({
  ownerState
}) => (0, _extends2.default)({
  flex: 1,
  padding: '6px 16px',
  textAlign: 'left'
}, ownerState.position === 'left' && {
  textAlign: 'right'
}));
const TimelineContent = /*#__PURE__*/React.forwardRef(function TimelineContent(inProps, ref) {
  const props = (0, _styles.useThemeProps)({
    props: inProps,
    name: 'MuiTimelineContent'
  });
  const {
      className
    } = props,
    other = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
  const {
    position: positionContext
  } = React.useContext(_TimelineContext.default);
  const ownerState = (0, _extends2.default)({}, props, {
    position: positionContext || 'right'
  });
  const classes = useUtilityClasses(ownerState);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(TimelineContentRoot, (0, _extends2.default)({
    component: "div",
    className: (0, _clsx.default)(classes.root, className),
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
  children: _propTypes.default.node,
  /**
   * Override or extend the styles applied to the component.
   */
  classes: _propTypes.default.object,
  /**
   * @ignore
   */
  className: _propTypes.default.string,
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: _propTypes.default.oneOfType([_propTypes.default.arrayOf(_propTypes.default.oneOfType([_propTypes.default.func, _propTypes.default.object, _propTypes.default.bool])), _propTypes.default.func, _propTypes.default.object])
} : void 0;
var _default = exports.default = TimelineContent;