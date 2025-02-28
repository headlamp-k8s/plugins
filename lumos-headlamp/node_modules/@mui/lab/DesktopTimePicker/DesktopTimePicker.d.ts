import * as React from 'react';
type DesktopTimePickerComponent = (<TDate>(props: DesktopTimePickerProps<TDate> & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The DesktopTimePicker component was moved from `@mui/lab` to `@mui/x-date-pickers-pro`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
declare const DesktopTimePicker: DesktopTimePickerComponent;
export default DesktopTimePicker;
export type DesktopTimePickerProps<TDate> = Record<any, any>;
