import * as React from 'react';
type MobileDateTimePickerComponent = (<TDate>(props: MobileDateTimePickerProps<TDate> & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The MobileDateTimePicker component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
declare const MobileDateTimePicker: MobileDateTimePickerComponent;
export default MobileDateTimePicker;
export type MobileDateTimePickerProps<TDate> = Record<any, any>;
