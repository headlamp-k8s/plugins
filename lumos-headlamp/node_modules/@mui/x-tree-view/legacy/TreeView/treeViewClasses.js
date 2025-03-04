import generateUtilityClass from '@mui/utils/generateUtilityClass';
import generateUtilityClasses from '@mui/utils/generateUtilityClasses';
export function getTreeViewUtilityClass(slot) {
  return generateUtilityClass('MuiTreeView', slot);
}
export var treeViewClasses = generateUtilityClasses('MuiTreeView', ['root']);