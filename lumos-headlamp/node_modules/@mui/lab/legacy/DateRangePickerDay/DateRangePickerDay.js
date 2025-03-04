/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
var warnedOnce = false;
var warn = function warn() {
  if (!warnedOnce) {
    console.warn(['MUI: The DateRangePickerDay component was moved from `@mui/lab` to `@mui/x-date-pickers-pro`', '', "You should use `import { DateRangePickerDay } from '@mui/x-date-pickers-pro'`", "or `import { DateRangePickerDay } from '@mui/x-date-pickers-pro/DateRangePickerDay'`", '', 'More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.'].join('\n'));
    warnedOnce = true;
  }
};
/**
 * @deprecated The DateRangePickerDay component was moved from `@mui/lab` to `@mui/x-date-pickers-pro`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
var DateRangePickerDay = /*#__PURE__*/React.forwardRef(function DeprecatedDateRangePickerDay() {
  warn();
  return null;
});
export default DateRangePickerDay;
export var getDateRangePickerDayUtilityClass = function getDateRangePickerDayUtilityClass(slot) {
  warn();
  return '';
};