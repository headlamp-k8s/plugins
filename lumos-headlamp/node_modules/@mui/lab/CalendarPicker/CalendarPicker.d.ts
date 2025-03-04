import * as React from 'react';
type CalendarPickerComponent = (<TDate>(props: CalendarPickerProps<TDate> & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The CalendarPicker component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
declare const CalendarPicker: CalendarPickerComponent;
export default CalendarPicker;
export declare const calendarPickerClasses: {};
export type CalendarPickerClassKey = any;
export type CalendarPickerClasses = any;
export type CalendarPickerProps<TDate> = Record<any, any>;
export type CalendarPickerView = 'year' | 'day' | 'month';
