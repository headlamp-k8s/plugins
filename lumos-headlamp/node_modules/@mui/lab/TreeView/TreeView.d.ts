import * as React from 'react';
type TreeViewComponent<Multiple extends boolean | undefined = undefined> = ((props: TreeViewProps<Multiple> & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The TreeView component was moved from `@mui/lab` to `@mui/x-tree-view`. More information about this migration on our blog: https://mui.com/blog/lab-tree-view-to-mui-x/.
 * @ignore - do not document.
 */
declare const TreeView: TreeViewComponent;
export default TreeView;
export type TreeViewProps<Multiple> = Record<any, any>;
