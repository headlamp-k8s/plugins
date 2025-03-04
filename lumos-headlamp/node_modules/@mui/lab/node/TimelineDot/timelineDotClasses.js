"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.getTimelineDotUtilityClass = getTimelineDotUtilityClass;
var _generateUtilityClass = _interopRequireDefault(require("@mui/utils/generateUtilityClass"));
var _generateUtilityClasses = _interopRequireDefault(require("@mui/utils/generateUtilityClasses"));
function getTimelineDotUtilityClass(slot) {
  return (0, _generateUtilityClass.default)('MuiTimelineDot', slot);
}
const timelineDotClasses = (0, _generateUtilityClasses.default)('MuiTimelineDot', ['root', 'filled', 'outlined', 'filledGrey', 'outlinedGrey', 'filledPrimary', 'outlinedPrimary', 'filledSecondary', 'outlinedSecondary']);
var _default = exports.default = timelineDotClasses;