import * as React from 'react';
type PickersDayComponent = (<TDate>(props: PickersDayProps<TDate> & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The PickersDay component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
declare const PickersDay: PickersDayComponent;
export default PickersDay;
export declare const pickersDayClasses: {};
export declare const getPickersDayUtilityClass: (slot: string) => string;
export type PickersDayProps<TDate> = Record<any, any>;
export type PickersDayClassKey = any;
