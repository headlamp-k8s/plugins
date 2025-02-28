import generateUtilityClass from '@mui/utils/generateUtilityClass';
import generateUtilityClasses from '@mui/utils/generateUtilityClasses';
export function getTimelineContentUtilityClass(slot) {
  return generateUtilityClass('MuiTimelineContent', slot);
}
var timelineContentClasses = generateUtilityClasses('MuiTimelineContent', ['root', 'positionLeft', 'positionRight', 'positionAlternate', 'positionAlternateReverse']);
export default timelineContentClasses;