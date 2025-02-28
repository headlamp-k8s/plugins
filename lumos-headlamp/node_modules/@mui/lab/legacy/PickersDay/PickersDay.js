'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
var warnedOnce = false;
var warn = function warn() {
  if (!warnedOnce) {
    console.warn(['MUI: The PickersDay component was moved from `@mui/lab` to `@mui/x-date-pickers`.', '', "You should use `import { PickersDay } from '@mui/x-date-pickers'`", "or `import { PickersDay } from '@mui/x-date-pickers/PickersDay'`", '', 'More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.'].join('\n'));
    warnedOnce = true;
  }
};
/**
 * @deprecated The PickersDay component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
var PickersDay = /*#__PURE__*/React.forwardRef(function DeprecatedPickersDay() {
  warn();
  return null;
});
export default PickersDay;
export var pickersDayClasses = {};
export var getPickersDayUtilityClass = function getPickersDayUtilityClass(slot) {
  warn();
  return '';
};