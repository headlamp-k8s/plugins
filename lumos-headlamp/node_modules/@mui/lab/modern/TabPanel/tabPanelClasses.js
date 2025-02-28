import generateUtilityClass from '@mui/utils/generateUtilityClass';
import generateUtilityClasses from '@mui/utils/generateUtilityClasses';
export function getTabPanelUtilityClass(slot) {
  return generateUtilityClass('MuiTabPanel', slot);
}
const tabPanelClasses = generateUtilityClasses('MuiTabPanel', ['root']);
export default tabPanelClasses;