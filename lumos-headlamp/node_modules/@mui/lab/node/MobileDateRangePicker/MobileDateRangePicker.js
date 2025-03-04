"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var React = _interopRequireWildcard(require("react"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
/* eslint-disable @typescript-eslint/no-unused-vars */

let warnedOnce = false;
const warn = () => {
  if (!warnedOnce) {
    console.warn(['MUI: The MobileDateRangePicker component was moved from `@mui/lab` to `@mui/x-date-pickers-pro`', '', "You should use `import { MobileDateRangePicker } from '@mui/x-date-pickers-pro'`", "or `import { MobileDateRangePicker } from '@mui/x-date-pickers-pro/MobileDateRangePicker'`", '', 'More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.'].join('\n'));
    warnedOnce = true;
  }
};
/**
 * @deprecated The MobileDateRangePicker component was moved from `@mui/lab` to `@mui/x-date-pickers-pro`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
const MobileDateRangePicker = /*#__PURE__*/React.forwardRef(function DeprecatedMobileDateRangePicker() {
  warn();
  return null;
});
var _default = exports.default = MobileDateRangePicker;