import generateUtilityClass from '@mui/utils/generateUtilityClass';
import generateUtilityClasses from '@mui/utils/generateUtilityClasses';
export function getTimelineItemUtilityClass(slot) {
  return generateUtilityClass('MuiTimelineItem', slot);
}
const timelineItemClasses = generateUtilityClasses('MuiTimelineItem', ['root', 'positionLeft', 'positionRight', 'positionAlternate', 'positionAlternateReverse', 'missingOppositeContent']);
export default timelineItemClasses;