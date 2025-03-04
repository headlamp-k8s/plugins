"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useTreeViewKeyboardNavigation = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var React = _interopRequireWildcard(require("react"));
var _styles = require("@mui/material/styles");
var _useEventCallback = _interopRequireDefault(require("@mui/utils/useEventCallback"));
var _useTreeView = require("../../useTreeView/useTreeView.utils");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function isPrintableCharacter(string) {
  return string && string.length === 1 && string.match(/\S/);
}
function findNextFirstChar(firstChars, startIndex, char) {
  for (let i = startIndex; i < firstChars.length; i += 1) {
    if (char === firstChars[i]) {
      return i;
    }
  }
  return -1;
}
const useTreeViewKeyboardNavigation = ({
  instance,
  params,
  state
}) => {
  const theme = (0, _styles.useTheme)();
  const isRtl = theme.direction === 'rtl';
  const firstCharMap = React.useRef({});
  const mapFirstChar = (0, _useEventCallback.default)((nodeId, firstChar) => {
    firstCharMap.current[nodeId] = firstChar;
    return () => {
      const newMap = (0, _extends2.default)({}, firstCharMap.current);
      delete newMap[nodeId];
      firstCharMap.current = newMap;
    };
  });
  (0, _useTreeView.populateInstance)(instance, {
    mapFirstChar
  });
  const handleNextArrow = event => {
    if (state.focusedNodeId != null && instance.isNodeExpandable(state.focusedNodeId)) {
      if (instance.isNodeExpanded(state.focusedNodeId)) {
        instance.focusNode(event, (0, _useTreeView.getNextNode)(instance, state.focusedNodeId));
      } else if (!instance.isNodeDisabled(state.focusedNodeId)) {
        instance.toggleNodeExpansion(event, state.focusedNodeId);
      }
    }
    return true;
  };
  const handlePreviousArrow = event => {
    if (state.focusedNodeId == null) {
      return false;
    }
    if (instance.isNodeExpanded(state.focusedNodeId) && !instance.isNodeDisabled(state.focusedNodeId)) {
      instance.toggleNodeExpansion(event, state.focusedNodeId);
      return true;
    }
    const parent = instance.getNode(state.focusedNodeId).parentId;
    if (parent) {
      instance.focusNode(event, parent);
      return true;
    }
    return false;
  };
  const focusByFirstCharacter = (event, nodeId, firstChar) => {
    let start;
    let index;
    const lowercaseChar = firstChar.toLowerCase();
    const firstCharIds = [];
    const firstChars = [];
    // This really only works since the ids are strings
    Object.keys(firstCharMap.current).forEach(mapNodeId => {
      const map = instance.getNode(mapNodeId);
      const visible = map.parentId ? instance.isNodeExpanded(map.parentId) : true;
      const shouldBeSkipped = params.disabledItemsFocusable ? false : instance.isNodeDisabled(mapNodeId);
      if (visible && !shouldBeSkipped) {
        firstCharIds.push(mapNodeId);
        firstChars.push(firstCharMap.current[mapNodeId]);
      }
    });

    // Get start index for search based on position of currentItem
    start = firstCharIds.indexOf(nodeId) + 1;
    if (start >= firstCharIds.length) {
      start = 0;
    }

    // Check remaining slots in the menu
    index = findNextFirstChar(firstChars, start, lowercaseChar);

    // If not found in remaining slots, check from beginning
    if (index === -1) {
      index = findNextFirstChar(firstChars, 0, lowercaseChar);
    }

    // If match was found...
    if (index > -1) {
      instance.focusNode(event, firstCharIds[index]);
    }
  };
  const selectNextNode = (event, id) => {
    if (!instance.isNodeDisabled((0, _useTreeView.getNextNode)(instance, id))) {
      instance.selectRange(event, {
        end: (0, _useTreeView.getNextNode)(instance, id),
        current: id
      }, true);
    }
  };
  const selectPreviousNode = (event, nodeId) => {
    if (!instance.isNodeDisabled((0, _useTreeView.getPreviousNode)(instance, nodeId))) {
      instance.selectRange(event, {
        end: (0, _useTreeView.getPreviousNode)(instance, nodeId),
        current: nodeId
      }, true);
    }
  };
  const createHandleKeyDown = otherHandlers => event => {
    otherHandlers.onKeyDown?.(event);
    let flag = false;
    const key = event.key;

    // If the tree is empty there will be no focused node
    if (event.altKey || event.currentTarget !== event.target || state.focusedNodeId == null) {
      return;
    }
    const ctrlPressed = event.ctrlKey || event.metaKey;
    switch (key) {
      case ' ':
        if (!params.disableSelection && !instance.isNodeDisabled(state.focusedNodeId)) {
          flag = true;
          if (params.multiSelect && event.shiftKey) {
            instance.selectRange(event, {
              end: state.focusedNodeId
            });
          } else if (params.multiSelect) {
            instance.selectNode(event, state.focusedNodeId, true);
          } else {
            instance.selectNode(event, state.focusedNodeId);
          }
        }
        event.stopPropagation();
        break;
      case 'Enter':
        if (!instance.isNodeDisabled(state.focusedNodeId)) {
          if (instance.isNodeExpandable(state.focusedNodeId)) {
            instance.toggleNodeExpansion(event, state.focusedNodeId);
            flag = true;
          } else if (!params.disableSelection) {
            flag = true;
            if (params.multiSelect) {
              instance.selectNode(event, state.focusedNodeId, true);
            } else {
              instance.selectNode(event, state.focusedNodeId);
            }
          }
        }
        event.stopPropagation();
        break;
      case 'ArrowDown':
        if (params.multiSelect && event.shiftKey && !params.disableSelection) {
          selectNextNode(event, state.focusedNodeId);
        }
        instance.focusNode(event, (0, _useTreeView.getNextNode)(instance, state.focusedNodeId));
        flag = true;
        break;
      case 'ArrowUp':
        if (params.multiSelect && event.shiftKey && !params.disableSelection) {
          selectPreviousNode(event, state.focusedNodeId);
        }
        instance.focusNode(event, (0, _useTreeView.getPreviousNode)(instance, state.focusedNodeId));
        flag = true;
        break;
      case 'ArrowRight':
        if (isRtl) {
          flag = handlePreviousArrow(event);
        } else {
          flag = handleNextArrow(event);
        }
        break;
      case 'ArrowLeft':
        if (isRtl) {
          flag = handleNextArrow(event);
        } else {
          flag = handlePreviousArrow(event);
        }
        break;
      case 'Home':
        if (params.multiSelect && ctrlPressed && event.shiftKey && !params.disableSelection && !instance.isNodeDisabled(state.focusedNodeId)) {
          instance.rangeSelectToFirst(event, state.focusedNodeId);
        }
        instance.focusNode(event, (0, _useTreeView.getFirstNode)(instance));
        flag = true;
        break;
      case 'End':
        if (params.multiSelect && ctrlPressed && event.shiftKey && !params.disableSelection && !instance.isNodeDisabled(state.focusedNodeId)) {
          instance.rangeSelectToLast(event, state.focusedNodeId);
        }
        instance.focusNode(event, (0, _useTreeView.getLastNode)(instance));
        flag = true;
        break;
      default:
        if (key === '*') {
          instance.expandAllSiblings(event, state.focusedNodeId);
          flag = true;
        } else if (params.multiSelect && ctrlPressed && key.toLowerCase() === 'a' && !params.disableSelection) {
          instance.selectRange(event, {
            start: (0, _useTreeView.getFirstNode)(instance),
            end: (0, _useTreeView.getLastNode)(instance)
          });
          flag = true;
        } else if (!ctrlPressed && !event.shiftKey && isPrintableCharacter(key)) {
          focusByFirstCharacter(event, state.focusedNodeId, key);
          flag = true;
        }
    }
    if (flag) {
      event.preventDefault();
      event.stopPropagation();
    }
  };
  return {
    getRootProps: otherHandlers => ({
      onKeyDown: createHandleKeyDown(otherHandlers)
    })
  };
};
exports.useTreeViewKeyboardNavigation = useTreeViewKeyboardNavigation;