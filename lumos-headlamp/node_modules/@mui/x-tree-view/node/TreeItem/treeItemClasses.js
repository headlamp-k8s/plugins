"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getTreeItemUtilityClass = getTreeItemUtilityClass;
exports.treeItemClasses = void 0;
var _generateUtilityClass = _interopRequireDefault(require("@mui/utils/generateUtilityClass"));
var _generateUtilityClasses = _interopRequireDefault(require("@mui/utils/generateUtilityClasses"));
function getTreeItemUtilityClass(slot) {
  return (0, _generateUtilityClass.default)('MuiTreeItem', slot);
}
const treeItemClasses = exports.treeItemClasses = (0, _generateUtilityClasses.default)('MuiTreeItem', ['root', 'group', 'content', 'expanded', 'selected', 'focused', 'disabled', 'iconContainer', 'label']);