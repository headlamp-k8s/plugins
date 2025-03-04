import * as React from 'react';
type DateTimePickerComponent = (<TDate>(props: DateTimePickerProps<TDate> & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The DateTimePicker component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
declare const DateTimePicker: DateTimePickerComponent;
export default DateTimePicker;
export type DateTimePickerProps<TDate> = Record<any, any>;
