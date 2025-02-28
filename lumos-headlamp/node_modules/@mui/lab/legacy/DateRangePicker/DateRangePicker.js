/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
var warnedOnce = false;
var warn = function warn() {
  if (!warnedOnce) {
    console.warn(['MUI: The DateRangePicker component was moved from `@mui/lab` to `@mui/x-date-pickers-pro`', '', "You should use `import { DateRangePicker } from '@mui/x-date-pickers-pro'`", "or `import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker'`", '', 'More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.'].join('\n'));
    warnedOnce = true;
  }
};
/**
 * @deprecated The DateRangePicker component was moved from `@mui/lab` to `@mui/x-date-pickers-pro`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
var DateRangePicker = /*#__PURE__*/React.forwardRef(function DeprecatedDateRangePicker() {
  warn();
  return null;
});
export default DateRangePicker;