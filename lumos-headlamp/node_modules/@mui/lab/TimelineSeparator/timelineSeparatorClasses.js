import generateUtilityClass from '@mui/utils/generateUtilityClass';
import generateUtilityClasses from '@mui/utils/generateUtilityClasses';
export function getTimelineSeparatorUtilityClass(slot) {
  return generateUtilityClass('MuiTimelineSeparator', slot);
}
const timelineSeparatorClasses = generateUtilityClasses('MuiTimelineSeparator', ['root']);
export default timelineSeparatorClasses;