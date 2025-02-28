"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
exports.getTabPanelUtilityClass = getTabPanelUtilityClass;
var _generateUtilityClass = _interopRequireDefault(require("@mui/utils/generateUtilityClass"));
var _generateUtilityClasses = _interopRequireDefault(require("@mui/utils/generateUtilityClasses"));
function getTabPanelUtilityClass(slot) {
  return (0, _generateUtilityClass.default)('MuiTabPanel', slot);
}
const tabPanelClasses = (0, _generateUtilityClasses.default)('MuiTabPanel', ['root']);
var _default = exports.default = tabPanelClasses;