import _createClass from "@babel/runtime/helpers/esm/createClass";
import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
var warnedOnce = false;
var warn = function warn() {
  if (!warnedOnce) {
    console.warn(['MUI: The AdapterDateFns class was moved from `@mui/lab` to `@mui/x-date-pickers`', '', "You should use `import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'`", '', 'More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.'].join('\n'));
    warnedOnce = true;
  }
};

/**
 * @deprecated The AdapterDateFns class was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 */
var AdapterDateFns = /*#__PURE__*/_createClass(function AdapterDateFns() {
  _classCallCheck(this, AdapterDateFns);
  warn();
});
export { AdapterDateFns as default };