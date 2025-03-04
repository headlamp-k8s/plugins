import _createClass from "@babel/runtime/helpers/esm/createClass";
import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
var warnedOnce = false;
var warn = function warn() {
  if (!warnedOnce) {
    console.warn(['MUI: The AdapterLuxon class was moved from `@mui/lab` to `@mui/x-date-pickers`', '', "You should use `import { AdapterLuxon } from '@mui/x-date-pickers/AdapterLuxon'`", '', 'More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.'].join('\n'));
    warnedOnce = true;
  }
};

/**
 * @deprecated The AdapterLuxon class was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 */
var AdapterLuxon = /*#__PURE__*/_createClass(function AdapterLuxon() {
  _classCallCheck(this, AdapterLuxon);
  warn();
});
export { AdapterLuxon as default };