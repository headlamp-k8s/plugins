import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import useEventCallback from '@mui/utils/useEventCallback';
import { getFirstNode, getLastNode, getNextNode, getPreviousNode, populateInstance } from '../../useTreeView/useTreeView.utils';
function isPrintableCharacter(string) {
  return string && string.length === 1 && string.match(/\S/);
}
function findNextFirstChar(firstChars, startIndex, char) {
  for (var i = startIndex; i < firstChars.length; i += 1) {
    if (char === firstChars[i]) {
      return i;
    }
  }
  return -1;
}
export var useTreeViewKeyboardNavigation = function useTreeViewKeyboardNavigation(_ref) {
  var instance = _ref.instance,
    params = _ref.params,
    state = _ref.state;
  var theme = useTheme();
  var isRtl = theme.direction === 'rtl';
  var firstCharMap = React.useRef({});
  var mapFirstChar = useEventCallback(function (nodeId, firstChar) {
    firstCharMap.current[nodeId] = firstChar;
    return function () {
      var newMap = _extends({}, firstCharMap.current);
      delete newMap[nodeId];
      firstCharMap.current = newMap;
    };
  });
  populateInstance(instance, {
    mapFirstChar: mapFirstChar
  });
  var handleNextArrow = function handleNextArrow(event) {
    if (state.focusedNodeId != null && instance.isNodeExpandable(state.focusedNodeId)) {
      if (instance.isNodeExpanded(state.focusedNodeId)) {
        instance.focusNode(event, getNextNode(instance, state.focusedNodeId));
      } else if (!instance.isNodeDisabled(state.focusedNodeId)) {
        instance.toggleNodeExpansion(event, state.focusedNodeId);
      }
    }
    return true;
  };
  var handlePreviousArrow = function handlePreviousArrow(event) {
    if (state.focusedNodeId == null) {
      return false;
    }
    if (instance.isNodeExpanded(state.focusedNodeId) && !instance.isNodeDisabled(state.focusedNodeId)) {
      instance.toggleNodeExpansion(event, state.focusedNodeId);
      return true;
    }
    var parent = instance.getNode(state.focusedNodeId).parentId;
    if (parent) {
      instance.focusNode(event, parent);
      return true;
    }
    return false;
  };
  var focusByFirstCharacter = function focusByFirstCharacter(event, nodeId, firstChar) {
    var start;
    var index;
    var lowercaseChar = firstChar.toLowerCase();
    var firstCharIds = [];
    var firstChars = [];
    // This really only works since the ids are strings
    Object.keys(firstCharMap.current).forEach(function (mapNodeId) {
      var map = instance.getNode(mapNodeId);
      var visible = map.parentId ? instance.isNodeExpanded(map.parentId) : true;
      var shouldBeSkipped = params.disabledItemsFocusable ? false : instance.isNodeDisabled(mapNodeId);
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
  var selectNextNode = function selectNextNode(event, id) {
    if (!instance.isNodeDisabled(getNextNode(instance, id))) {
      instance.selectRange(event, {
        end: getNextNode(instance, id),
        current: id
      }, true);
    }
  };
  var selectPreviousNode = function selectPreviousNode(event, nodeId) {
    if (!instance.isNodeDisabled(getPreviousNode(instance, nodeId))) {
      instance.selectRange(event, {
        end: getPreviousNode(instance, nodeId),
        current: nodeId
      }, true);
    }
  };
  var createHandleKeyDown = function createHandleKeyDown(otherHandlers) {
    return function (event) {
      var _otherHandlers$onKeyD;
      (_otherHandlers$onKeyD = otherHandlers.onKeyDown) == null || _otherHandlers$onKeyD.call(otherHandlers, event);
      var flag = false;
      var key = event.key;

      // If the tree is empty there will be no focused node
      if (event.altKey || event.currentTarget !== event.target || state.focusedNodeId == null) {
        return;
      }
      var ctrlPressed = event.ctrlKey || event.metaKey;
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
          instance.focusNode(event, getNextNode(instance, state.focusedNodeId));
          flag = true;
          break;
        case 'ArrowUp':
          if (params.multiSelect && event.shiftKey && !params.disableSelection) {
            selectPreviousNode(event, state.focusedNodeId);
          }
          instance.focusNode(event, getPreviousNode(instance, state.focusedNodeId));
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
          instance.focusNode(event, getFirstNode(instance));
          flag = true;
          break;
        case 'End':
          if (params.multiSelect && ctrlPressed && event.shiftKey && !params.disableSelection && !instance.isNodeDisabled(state.focusedNodeId)) {
            instance.rangeSelectToLast(event, state.focusedNodeId);
          }
          instance.focusNode(event, getLastNode(instance));
          flag = true;
          break;
        default:
          if (key === '*') {
            instance.expandAllSiblings(event, state.focusedNodeId);
            flag = true;
          } else if (params.multiSelect && ctrlPressed && key.toLowerCase() === 'a' && !params.disableSelection) {
            instance.selectRange(event, {
              start: getFirstNode(instance),
              end: getLastNode(instance)
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
  };
  return {
    getRootProps: function getRootProps(otherHandlers) {
      return {
        onKeyDown: createHandleKeyDown(otherHandlers)
      };
    }
  };
};