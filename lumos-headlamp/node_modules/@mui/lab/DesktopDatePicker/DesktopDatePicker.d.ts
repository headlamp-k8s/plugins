import * as React from 'react';
type DesktopDatePickerComponent = (<TDate>(props: DesktopDatePickerProps<TDate> & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The DesktopDatePicker component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
declare const DesktopDatePicker: DesktopDatePickerComponent;
export default DesktopDatePicker;
export type DesktopDatePickerProps<TDate> = Record<any, any>;
