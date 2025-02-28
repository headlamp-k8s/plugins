import * as React from 'react';
type DatePickerComponent = (<TDate>(props: DatePickerProps<TDate> & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @ignore - do not document.
 */
declare const DatePicker: DatePickerComponent;
export default DatePicker;
export type DatePickerProps<TDate> = Record<any, any>;
