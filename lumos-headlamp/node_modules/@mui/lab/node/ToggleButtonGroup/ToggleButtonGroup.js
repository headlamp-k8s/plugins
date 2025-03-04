"use strict";
'use client';

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var React = _interopRequireWildcard(require("react"));
var _ToggleButtonGroup = _interopRequireDefault(require("@mui/material/ToggleButtonGroup"));
var _jsxRuntime = require("react/jsx-runtime");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
let warnedOnce = false;

/**
 * @ignore - do not document.
 */
var _default = exports.default = /*#__PURE__*/React.forwardRef(function DeprecatedToggleButtonGroup(props, ref) {
  if (!warnedOnce) {
    console.warn(['MUI: The ToggleButtonGroup component was moved from the lab to the core.', '', "You should use `import { ToggleButtonGroup } from '@mui/material'`", "or `import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'`"].join('\n'));
    warnedOnce = true;
  }
  return /*#__PURE__*/(0, _jsxRuntime.jsx)(_ToggleButtonGroup.default, (0, _extends2.default)({
    ref: ref
  }, props));
});