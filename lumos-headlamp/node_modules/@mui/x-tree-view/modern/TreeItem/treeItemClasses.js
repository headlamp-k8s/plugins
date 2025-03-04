import generateUtilityClass from '@mui/utils/generateUtilityClass';
import generateUtilityClasses from '@mui/utils/generateUtilityClasses';
export function getTreeItemUtilityClass(slot) {
  return generateUtilityClass('MuiTreeItem', slot);
}
export const treeItemClasses = generateUtilityClasses('MuiTreeItem', ['root', 'group', 'content', 'expanded', 'selected', 'focused', 'disabled', 'iconContainer', 'label']);