import _createClass from "@babel/runtime/helpers/esm/createClass";
import _classCallCheck from "@babel/runtime/helpers/esm/classCallCheck";
var warnedOnce = false;
var warn = function warn() {
  if (!warnedOnce) {
    console.warn(['MUI: The AdapterMoment class was moved from `@mui/lab` to `@mui/x-date-pickers`', '', "You should use `import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'`", '', 'More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.'].join('\n'));
    warnedOnce = true;
  }
};

/**
 * @deprecated The AdapterMoment class was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 */
var AdapterMoment = /*#__PURE__*/_createClass(function AdapterMoment() {
  _classCallCheck(this, AdapterMoment);
  warn();
});
export { AdapterMoment as default };