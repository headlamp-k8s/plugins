import useId from '@mui/utils/useId';
export const useTreeViewContextValueBuilder = ({
  instance,
  params
}) => {
  const treeId = useId(params.id);
  return {
    getRootProps: () => ({
      id: treeId
    }),
    contextValue: {
      treeId,
      instance: instance,
      multiSelect: params.multiSelect,
      disabledItemsFocusable: params.disabledItemsFocusable,
      icons: {
        defaultCollapseIcon: params.defaultCollapseIcon,
        defaultEndIcon: params.defaultEndIcon,
        defaultExpandIcon: params.defaultExpandIcon,
        defaultParentIcon: params.defaultParentIcon
      }
    }
  };
};