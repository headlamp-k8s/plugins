import * as React from 'react';
type StaticDatePickerComponent = (<TDate>(props: StaticDatePickerProps<TDate> & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The StaticDatePicker component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
declare const StaticDatePicker: StaticDatePickerComponent;
export default StaticDatePicker;
export type StaticDatePickerProps<TDate> = Record<any, any>;
