import * as React from 'react';
type StaticTimePickerComponent = (<TDate>(props: StaticTimePickerProps<TDate> & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The StaticTimePicker component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
declare const StaticTimePicker: StaticTimePickerComponent;
export default StaticTimePicker;
export type StaticTimePickerProps<TDate> = Record<any, any>;
