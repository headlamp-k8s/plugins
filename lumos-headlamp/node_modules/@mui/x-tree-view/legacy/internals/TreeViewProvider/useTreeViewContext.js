import * as React from 'react';
import { TreeViewContext } from './TreeViewContext';
export var useTreeViewContext = function useTreeViewContext() {
  return React.useContext(TreeViewContext);
};