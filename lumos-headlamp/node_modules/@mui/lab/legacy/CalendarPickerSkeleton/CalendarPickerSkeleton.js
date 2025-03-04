'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from 'react';
var warnedOnce = false;
var warn = function warn() {
  if (!warnedOnce) {
    console.warn(['MUI: The CalendarPickerSkeleton component was moved from `@mui/lab` to `@mui/x-date-pickers`.', '', "You should use `import { CalendarPickerSkeleton } from '@mui/x-date-pickers'`", "or `import { CalendarPickerSkeleton } from '@mui/x-date-pickers/CalendarPickerSkeleton'`", '', 'More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.'].join('\n'));
    warnedOnce = true;
  }
};
/**
 * @deprecated The CalendarPickerSkeleton component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
var CalendarPickerSkeleton = /*#__PURE__*/React.forwardRef(function DeprecatedCalendarPickerSkeleton() {
  warn();
  return null;
});
export default CalendarPickerSkeleton;
export var calendarPickerSkeletonClasses = {};
export var getCalendarPickerSkeletonUtilityClass = function getCalendarPickerSkeletonUtilityClass(slot) {
  warn();
  return '';
};