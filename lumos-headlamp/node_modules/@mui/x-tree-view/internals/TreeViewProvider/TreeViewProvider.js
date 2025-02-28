import * as React from 'react';
import { TreeViewContext } from './TreeViewContext';
import { DescendantProvider } from './DescendantProvider';
import { jsx as _jsx } from "react/jsx-runtime";
/**
 * Sets up the contexts for the underlying TreeItem components.
 *
 * @ignore - do not document.
 */
export function TreeViewProvider(props) {
  const {
    value,
    children
  } = props;
  return /*#__PURE__*/_jsx(TreeViewContext.Provider, {
    value: value,
    children: /*#__PURE__*/_jsx(DescendantProvider, {
      children: children
    })
  });
}