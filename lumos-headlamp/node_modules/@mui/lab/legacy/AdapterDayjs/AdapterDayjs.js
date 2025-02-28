import _createClass from "@babel/runtime/helpers/esm/createClass";
import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
var warnedOnce = false;
var warn = function warn() {
  if (!warnedOnce) {
    console.warn(['MUI: The AdapterDayjs class was moved from `@mui/lab` to `@mui/x-date-pickers`', '', "You should use `import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'`", '', 'More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.'].join('\n'));
    warnedOnce = true;
  }
};

/**
 * @deprecated The AdapterDayjs class was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 */
var AdapterDayjs = /*#__PURE__*/_createClass(function AdapterDayjs() {
  _classCallCheck(this, AdapterDayjs);
  warn();
});
export { AdapterDayjs as default };