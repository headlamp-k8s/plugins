import { capitalize } from '@mui/material/utils';
export default function convertTimelinePositionToClass(position) {
  return position === 'alternate-reverse' ? 'positionAlternateReverse' : "position".concat(capitalize(position));
}