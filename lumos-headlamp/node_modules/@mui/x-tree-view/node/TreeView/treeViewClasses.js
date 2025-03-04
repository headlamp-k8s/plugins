"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTreeViewUtilityClass = getTreeViewUtilityClass;
exports.treeViewClasses = void 0;
var _generateUtilityClass = _interopRequireDefault(require("@mui/utils/generateUtilityClass"));
var _generateUtilityClasses = _interopRequireDefault(require("@mui/utils/generateUtilityClasses"));
function getTreeViewUtilityClass(slot) {
  return (0, _generateUtilityClass.default)('MuiTreeView', slot);
}
const treeViewClasses = exports.treeViewClasses = (0, _generateUtilityClasses.default)('MuiTreeView', ['root']);