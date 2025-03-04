'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
var warnedOnce = false;
var warn = function warn() {
  if (!warnedOnce) {
    console.warn(['MUI: The YearPicker component was moved from `@mui/lab` to `@mui/x-date-pickers`.', '', "You should use `import { YearPicker } from '@mui/x-date-pickers'`", "or `import { YearPicker } from '@mui/x-date-pickers/YearPicker'`", '', 'More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.'].join('\n'));
    warnedOnce = true;
  }
};
/**
 * @deprecated The YearPicker component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
var YearPicker = function DeprecatedYearPicker() {
  warn();
  return null;
};
export default YearPicker;
export var yearPickerClasses = {};
export var getYearPickerUtilityClass = function getYearPickerUtilityClass(slot) {
  warn();
  return '';
};