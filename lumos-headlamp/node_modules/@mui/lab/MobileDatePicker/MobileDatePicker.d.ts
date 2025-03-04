import * as React from 'react';
type MobileDatePickerComponent = (<TDate>(props: MobileDatePickerProps<TDate> & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The MobileDatePicker component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
declare const MobileDatePicker: MobileDatePickerComponent;
export default MobileDatePicker;
export type MobileDatePickerProps<TDate> = Record<any, any>;
