import generateUtilityClass from '@mui/utils/generateUtilityClass';
import generateUtilityClasses from '@mui/utils/generateUtilityClasses';
export function getTimelineUtilityClass(slot) {
  return generateUtilityClass('MuiTimeline', slot);
}
var timelineClasses = generateUtilityClasses('MuiTimeline', ['root', 'positionLeft', 'positionRight', 'positionAlternate', 'positionAlternateReverse']);
export default timelineClasses;