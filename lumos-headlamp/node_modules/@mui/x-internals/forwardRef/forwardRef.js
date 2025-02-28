"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault").default;
var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard").default;
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.forwardRef = void 0;
var React = _interopRequireWildcard(require("react"));
var _reactMajor = _interopRequireDefault(require("../reactMajor"));
// Compatibility shim that ensures stable props object for forwardRef components
// Fixes https://github.com/facebook/react/issues/31613
// We ensure that the ref is always present in the props object (even if that's not the case for older versions of React) to avoid the footgun of spreading props over the ref in the newer versions of React.
// Footgun: <Component ref={ref} {...props} /> will break past React 19, but the types will now warn us that we should use <Component {...props} ref={ref} /> instead.
const forwardRef = render => {
  if (_reactMajor.default >= 19) {
    const Component = props => render(props, props.ref ?? null);
    Component.displayName = render.displayName ?? render.name;
    return Component;
  }
  return /*#__PURE__*/React.forwardRef(render);
};
exports.forwardRef = forwardRef;