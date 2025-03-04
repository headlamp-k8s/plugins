import { useTreeViewNodes } from './useTreeViewNodes';
import { useTreeViewExpansion } from './useTreeViewExpansion';
import { useTreeViewSelection } from './useTreeViewSelection';
import { useTreeViewFocus } from './useTreeViewFocus';
import { useTreeViewKeyboardNavigation } from './useTreeViewKeyboardNavigation';
import { useTreeViewContextValueBuilder } from './useTreeViewContextValueBuilder';
export const DEFAULT_TREE_VIEW_PLUGINS = [useTreeViewNodes, useTreeViewExpansion, useTreeViewSelection, useTreeViewFocus, useTreeViewKeyboardNavigation, useTreeViewContextValueBuilder];

// We can't infer this type from the plugin, otherwise we would lose the generics.