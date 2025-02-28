'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
let warnedOnce = false;
const warn = () => {
  if (!warnedOnce) {
    console.warn(['MUI: The DatePicker component was moved from `@mui/lab` to `@mui/x-date-pickers`.', '', "You should use `import { DatePicker } from '@mui/x-date-pickers'`", "or `import { DatePicker } from '@mui/x-date-pickers/DatePicker'`", '', 'More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.'].join('\n'));
    warnedOnce = true;
  }
};
/**
 * @ignore - do not document.
 */
const DatePicker = /*#__PURE__*/React.forwardRef(function DeprecatedDatePicker() {
  warn();
  return null;
});
export default DatePicker;