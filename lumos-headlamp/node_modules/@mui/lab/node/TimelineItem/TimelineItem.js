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
var _utils = require("@mui/material/utils");
var _styles = require("@mui/material/styles");
var _base = require("@mui/base");
var _TimelineContent = require("../TimelineContent");
var _TimelineOppositeContent = require("../TimelineOppositeContent");
var _TimelineContext = _interopRequireDefault(require("../Timeline/TimelineContext"));
var _timelineItemClasses = require("./timelineItemClasses");
var _convertTimelinePositionToClass = _interopRequireDefault(require("../internal/convertTimelinePositionToClass"));
var _jsxRuntime = require("react/jsx-runtime");
const _excluded = ["position", "className"];
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const useUtilityClasses = ownerState => {
  const {
    position,
    classes,
    hasOppositeContent
  } = ownerState;
  const slots = {
    root: ['root', (0, _convertTimelinePositionToClass.default)(position), !hasOppositeContent && 'missingOppositeContent']
  };
  return (0, _base.unstable_composeClasses)(slots, _timelineItemClasses.getTimelineItemUtilityClass, classes);
};
const TimelineItemRoot = (0, _styles.styled)('li', {
  name: 'MuiTimelineItem',
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
  listStyle: 'none',
  display: 'flex',
  position: 'relative',
  minHeight: 70
}, ownerState.position === 'left' && {
  flexDirection: 'row-reverse'
}, (ownerState.position === 'alternate' || ownerState.position === 'alternate-reverse') && {
  [`&:nth-of-type(${ownerState.position === 'alternate' ? 'even' : 'odd'})`]: {
    flexDirection: 'row-reverse',
    [`& .${_TimelineContent.timelineContentClasses.root}`]: {
      textAlign: 'right'
    },
    [`& .${_TimelineOppositeContent.timelineOppositeContentClasses.root}`]: {
      textAlign: 'left'
    }
  }
}, !ownerState.hasOppositeContent && {
  '&::before': {
    content: '""',
    flex: 1,
    padding: '6px 16px'
  }
}));
const TimelineItem = /*#__PURE__*/React.forwardRef(function TimelineItem(inProps, ref) {
  const props = (0, _styles.useThemeProps)({
    props: inProps,
    name: 'MuiTimelineItem'
  });
  const {
      position: positionProp,
      className
    } = props,
    other = (0, _objectWithoutPropertiesLoose2.default)(props, _excluded);
  const {
    position: positionContext
  } = React.useContext(_TimelineContext.default);
  let hasOppositeContent = false;
  React.Children.forEach(props.children, child => {
    if ((0, _utils.isMuiElement)(child, ['TimelineOppositeContent'])) {
      hasOppositeContent = true;
    }
  });
  const ownerState = (0, _extends2.default)({}, props, {
    position: positionProp || positionContext || 'right',
    hasOppositeContent
  });
  const classes = useUtilityClasses(ownerState);
  const contextValue = React.useMemo(() => ({
    position: ownerState.position
  }), [ownerState.position]);
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_TimelineContext.default.Provider, {
    value: contextValue,
    children: /*#__PURE__*/(0, _jsxRuntime.jsx)(TimelineItemRoot, (0, _extends2.default)({
      className: (0, _clsx.default)(classes.root, className),
      ownerState: ownerState,
      ref: ref
    }, other))
  });
});
process.env.NODE_ENV !== "production" ? TimelineItem.propTypes /* remove-proptypes */ = {
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
   * The position where the timeline's item should appear.
   */
  position: _propTypes.default.oneOf(['alternate-reverse', 'alternate', 'left', 'right']),
  /**
   * The system prop that allows defining system overrides as well as additional CSS styles.
   */
  sx: _propTypes.default.oneOfType([_propTypes.default.arrayOf(_propTypes.default.oneOfType([_propTypes.default.func, _propTypes.default.object, _propTypes.default.bool])), _propTypes.default.func, _propTypes.default.object])
} : void 0;
var _default = exports.default = TimelineItem;