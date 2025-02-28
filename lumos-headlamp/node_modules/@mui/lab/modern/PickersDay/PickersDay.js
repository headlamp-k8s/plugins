'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
let warnedOnce = false;
const warn = () => {
  if (!warnedOnce) {
    console.warn(['MUI: The PickersDay component was moved from `@mui/lab` to `@mui/x-date-pickers`.', '', "You should use `import { PickersDay } from '@mui/x-date-pickers'`", "or `import { PickersDay } from '@mui/x-date-pickers/PickersDay'`", '', 'More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.'].join('\n'));
    warnedOnce = true;
  }
};
/**
 * @deprecated The PickersDay component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
const PickersDay = /*#__PURE__*/React.forwardRef(function DeprecatedPickersDay() {
  warn();
  return null;
});
export default PickersDay;
export const pickersDayClasses = {};
export const getPickersDayUtilityClass = slot => {
  warn();
  return '';
};