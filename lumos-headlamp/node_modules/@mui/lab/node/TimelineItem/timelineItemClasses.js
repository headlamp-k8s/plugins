"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.getTimelineItemUtilityClass = getTimelineItemUtilityClass;
var _generateUtilityClass = _interopRequireDefault(require("@mui/utils/generateUtilityClass"));
var _generateUtilityClasses = _interopRequireDefault(require("@mui/utils/generateUtilityClasses"));
function getTimelineItemUtilityClass(slot) {
  return (0, _generateUtilityClass.default)('MuiTimelineItem', slot);
}
const timelineItemClasses = (0, _generateUtilityClasses.default)('MuiTimelineItem', ['root', 'positionLeft', 'positionRight', 'positionAlternate', 'positionAlternateReverse', 'missingOppositeContent']);
var _default = exports.default = timelineItemClasses;