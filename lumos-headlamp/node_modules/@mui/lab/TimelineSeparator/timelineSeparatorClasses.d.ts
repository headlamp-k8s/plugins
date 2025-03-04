export interface TimelineSeparatorClasses {
    /** Styles applied to the root element. */
    root: string;
}
export type TimelineSeparatorClassKey = keyof TimelineSeparatorClasses;
export declare function getTimelineSeparatorUtilityClass(slot: string): string;
declare const timelineSeparatorClasses: TimelineSeparatorClasses;
export default timelineSeparatorClasses;
