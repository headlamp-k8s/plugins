"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useTreeViewContextValueBuilder = void 0;
var _useId = _interopRequireDefault(require("@mui/utils/useId"));
const useTreeViewContextValueBuilder = ({
  instance,
  params
}) => {
  const treeId = (0, _useId.default)(params.id);
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
exports.useTreeViewContextValueBuilder = useTreeViewContextValueBuilder;