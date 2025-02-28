import * as React from 'react';
type MonthPickerComponent = (<TDate>(props: MonthPickerProps<TDate> & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The MonthPicker component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
declare const MonthPicker: MonthPickerComponent;
export default MonthPicker;
export declare const monthPickerClasses: {};
export declare const getMonthPickerUtilityClass: (slot: string) => string;
export type MonthPickerProps<TDate> = Record<any, any>;
export type MonthPickerClassKey = any;
