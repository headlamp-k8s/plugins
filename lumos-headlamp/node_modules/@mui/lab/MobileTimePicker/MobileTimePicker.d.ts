import * as React from 'react';
type MobileTimePickerComponent = (<TDate>(props: MobileTimePickerProps<TDate> & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The MobileTimePicker component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
declare const MobileTimePicker: MobileTimePickerComponent;
export default MobileTimePicker;
export type MobileTimePickerProps<TDate> = Record<any, any>;
