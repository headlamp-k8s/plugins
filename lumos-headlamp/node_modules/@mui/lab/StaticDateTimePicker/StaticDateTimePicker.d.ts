import * as React from 'react';
type StaticDateTimePickerComponent = (<TDate>(props: StaticDateTimePickerProps<TDate> & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The StaticDateTimePicker component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
declare const StaticDateTimePicker: StaticDateTimePickerComponent;
export default StaticDateTimePicker;
export type StaticDateTimePickerProps<TDate> = Record<any, any>;
