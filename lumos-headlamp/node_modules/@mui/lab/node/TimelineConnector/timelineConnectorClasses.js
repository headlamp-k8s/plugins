"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.getTimelineConnectorUtilityClass = getTimelineConnectorUtilityClass;
var _generateUtilityClass = _interopRequireDefault(require("@mui/utils/generateUtilityClass"));
var _generateUtilityClasses = _interopRequireDefault(require("@mui/utils/generateUtilityClasses"));
function getTimelineConnectorUtilityClass(slot) {
  return (0, _generateUtilityClass.default)('MuiTimelineConnector', slot);
}
const timelineConnectorClasses = (0, _generateUtilityClasses.default)('MuiTimelineConnector', ['root']);
var _default = exports.default = timelineConnectorClasses;