import generateUtilityClass from '@mui/utils/generateUtilityClass';
import generateUtilityClasses from '@mui/utils/generateUtilityClasses';
export function getMasonryUtilityClass(slot) {
  return generateUtilityClass('MuiMasonry', slot);
}
const masonryClasses = generateUtilityClasses('MuiMasonry', ['root']);
export default masonryClasses;