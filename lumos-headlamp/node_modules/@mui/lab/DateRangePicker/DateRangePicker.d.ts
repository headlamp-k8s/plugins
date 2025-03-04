import * as React from 'react';
type DateRangePickerComponent = (<TDate>(props: DateRangePickerProps & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The DateRangePicker component was moved from `@mui/lab` to `@mui/x-date-pickers-pro`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
declare const DateRangePicker: DateRangePickerComponent;
export default DateRangePicker;
export type DateRangePickerProps = Record<any, any>;
export type DateRange<TDate> = [TDate | null, TDate | null];
