"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.getMasonryUtilityClass = getMasonryUtilityClass;
var _generateUtilityClass = _interopRequireDefault(require("@mui/utils/generateUtilityClass"));
var _generateUtilityClasses = _interopRequireDefault(require("@mui/utils/generateUtilityClasses"));
function getMasonryUtilityClass(slot) {
  return (0, _generateUtilityClass.default)('MuiMasonry', slot);
}
const masonryClasses = (0, _generateUtilityClasses.default)('MuiMasonry', ['root']);
var _default = exports.default = masonryClasses;