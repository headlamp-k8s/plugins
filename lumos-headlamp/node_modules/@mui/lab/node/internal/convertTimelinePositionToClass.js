"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = convertTimelinePositionToClass;
var _utils = require("@mui/material/utils");
function convertTimelinePositionToClass(position) {
  return position === 'alternate-reverse' ? 'positionAlternateReverse' : `position${(0, _utils.capitalize)(position)}`;
}