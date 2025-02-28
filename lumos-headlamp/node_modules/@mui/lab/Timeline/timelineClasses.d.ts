export interface TimelineClasses {
    /** Styles applied to the root element. */
    root: string;
    /** Styles applied to the root element if `position="left"`. */
    positionLeft: string;
    /** Styles applied to the root element if `position="right"`. */
    positionRight: string;
    /** Styles applied to the root element if `position="alternate"`. */
    positionAlternate: string;
    /** Styles applied to the root element if `position="alternate-reverse"`. */
    positionAlternateReverse: string;
}
export type TimelineClassKey = keyof TimelineClasses;
export declare function getTimelineUtilityClass(slot: string): string;
declare const timelineClasses: TimelineClasses;
export default timelineClasses;
