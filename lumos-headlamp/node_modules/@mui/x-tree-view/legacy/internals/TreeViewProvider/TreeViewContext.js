import * as React from 'react';
export var DEFAULT_TREE_VIEW_CONTEXT_VALUE = {
  instance: null,
  multiSelect: false,
  disabledItemsFocusable: false,
  treeId: undefined,
  icons: {
    defaultCollapseIcon: null,
    defaultExpandIcon: null,
    defaultParentIcon: null,
    defaultEndIcon: null
  }
};

/**
 * @ignore - internal component.
 */
export var TreeViewContext = /*#__PURE__*/React.createContext(DEFAULT_TREE_VIEW_CONTEXT_VALUE);
if (process.env.NODE_ENV !== 'production') {
  TreeViewContext.displayName = 'TreeViewContext';
}