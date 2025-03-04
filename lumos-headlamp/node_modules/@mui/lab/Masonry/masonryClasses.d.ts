export interface MasonryClasses {
    /** Styles applied to the root element. */
    root: string;
}
export type MasonryClassKey = keyof MasonryClasses;
export declare function getMasonryUtilityClass(slot: string): string;
declare const masonryClasses: MasonryClasses;
export default masonryClasses;
