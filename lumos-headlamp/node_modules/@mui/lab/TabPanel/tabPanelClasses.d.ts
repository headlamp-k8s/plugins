export interface TabPanelClasses {
    /** Styles applied to the root element. */
    root: string;
}
export type TabPanelClassKey = keyof TabPanelClasses;
export declare function getTabPanelUtilityClass(slot: string): string;
declare const tabPanelClasses: TabPanelClasses;
export default tabPanelClasses;
