import * as React from 'react';
type DesktopDateTimePickerComponent = (<TDate>(props: DesktopDateTimePickerProps<TDate> & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The DesktopDateTimePicker component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
declare const DesktopDateTimePicker: DesktopDateTimePickerComponent;
export default DesktopDateTimePicker;
export type DesktopDateTimePickerProps<TDate> = Record<any, any>;
