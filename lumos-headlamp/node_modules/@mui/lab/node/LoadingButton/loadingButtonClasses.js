"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.getLoadingButtonUtilityClass = getLoadingButtonUtilityClass;
var _generateUtilityClass = _interopRequireDefault(require("@mui/utils/generateUtilityClass"));
var _generateUtilityClasses = _interopRequireDefault(require("@mui/utils/generateUtilityClasses"));
function getLoadingButtonUtilityClass(slot) {
  return (0, _generateUtilityClass.default)('MuiLoadingButton', slot);
}
const loadingButtonClasses = (0, _generateUtilityClasses.default)('MuiLoadingButton', ['root', 'loading', 'loadingIndicator', 'loadingIndicatorCenter', 'loadingIndicatorStart', 'loadingIndicatorEnd', 'endIconLoadingEnd', 'startIconLoadingStart']);
var _default = exports.default = loadingButtonClasses;