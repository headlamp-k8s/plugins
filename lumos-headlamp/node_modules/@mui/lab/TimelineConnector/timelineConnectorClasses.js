import generateUtilityClass from '@mui/utils/generateUtilityClass';
import generateUtilityClasses from '@mui/utils/generateUtilityClasses';
export function getTimelineConnectorUtilityClass(slot) {
  return generateUtilityClass('MuiTimelineConnector', slot);
}
const timelineConnectorClasses = generateUtilityClasses('MuiTimelineConnector', ['root']);
export default timelineConnectorClasses;