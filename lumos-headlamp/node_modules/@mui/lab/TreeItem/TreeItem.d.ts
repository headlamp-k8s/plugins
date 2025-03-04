import * as React from 'react';
type TreeItemComponent = ((props: TreeItemProps & React.RefAttributes<HTMLDivElement>) => React.JSX.Element) & {
    propTypes?: any;
};
/**
 * @deprecated The TreeItem component was moved from `@mui/lab` to `@mui/x-tree-view`. More information about this migration on our blog: https://mui.com/blog/lab-tree-view-to-mui-x/.
 * @ignore - do not document.
 */
declare const TreeItem: TreeItemComponent;
export default TreeItem;
export type TreeItemProps = Record<any, any>;
