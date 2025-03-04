import * as React from 'react';
type TimePickerComponent = (<TDate>(props: TimePickerProps<TDate> & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The StaticTimePicker component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
declare const TimePicker: TimePickerComponent;
export default TimePicker;
export type TimePickerProps<TDate> = Record<any, any>;
