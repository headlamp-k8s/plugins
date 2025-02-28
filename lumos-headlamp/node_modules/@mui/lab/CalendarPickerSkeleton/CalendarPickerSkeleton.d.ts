import * as React from 'react';
type CalendarPickerSkeletonComponent = ((props: CalendarPickerSkeletonProps & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The CalendarPickerSkeleton component was moved from `@mui/lab` to `@mui/x-date-pickers`. More information about this migration on our blog: https://mui.com/blog/lab-date-pickers-to-mui-x/.
 * @ignore - do not document.
 */
declare const CalendarPickerSkeleton: CalendarPickerSkeletonComponent;
export default CalendarPickerSkeleton;
export declare const calendarPickerSkeletonClasses: {};
export declare const getCalendarPickerSkeletonUtilityClass: (slot: string) => string;
export type CalendarPickerSkeletonProps = Record<any, any>;
export type CalendarPickerSkeletonClassKey = any;
