import * as React from 'react';
type ClockPickerComponent = (<TDate>(props: ClockPickerProps<TDate> & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The ClockPicker component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
declare const ClockPicker: ClockPickerComponent;
export default ClockPicker;
export declare const clockPickerClasses: {};
export type ClockPickerProps<TDate> = Record<any, any>;
export type ClockPickerView = 'hours' | 'minutes' | 'seconds';
export type ClockPickerClasses = any;
export type ClockPickerClassKey = any;
