import useId from '@mui/utils/useId';
export var useTreeViewContextValueBuilder = function useTreeViewContextValueBuilder(_ref) {
  var instance = _ref.instance,
    params = _ref.params;
  var treeId = useId(params.id);
  return {
    getRootProps: function getRootProps() {
      return {
        id: treeId
      };
    },
    contextValue: {
      treeId: treeId,
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