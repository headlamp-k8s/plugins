import _extends from "@babel/runtime/helpers/esm/extends";
import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
import * as React from 'react';
import { populateInstance, getNextNode, getFirstNode, getLastNode } from '../../useTreeView/useTreeView.utils';
import { findOrderInTremauxTree } from './useTreeViewSelection.utils';
export var useTreeViewSelection = function useTreeViewSelection(_ref) {
  var instance = _ref.instance,
    params = _ref.params,
    models = _ref.models;
  var lastSelectedNode = React.useRef(null);
  var lastSelectionWasRange = React.useRef(false);
  var currentRangeSelection = React.useRef([]);
  var isNodeSelected = function isNodeSelected(nodeId) {
    return Array.isArray(models.selected.value) ? models.selected.value.indexOf(nodeId) !== -1 : models.selected.value === nodeId;
  };
  var selectNode = function selectNode(event, nodeId) {
    var multiple = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    if (params.disableSelection) {
      return;
    }
    if (multiple) {
      if (Array.isArray(models.selected.value)) {
        var newSelected;
        if (models.selected.value.indexOf(nodeId) !== -1) {
          newSelected = models.selected.value.filter(function (id) {
            return id !== nodeId;
          });
        } else {
          newSelected = [nodeId].concat(models.selected.value);
        }
        if (params.onNodeSelect) {
          params.onNodeSelect(event, newSelected);
        }
        models.selected.setValue(newSelected);
      }
    } else {
      var _newSelected = params.multiSelect ? [nodeId] : nodeId;
      if (params.onNodeSelect) {
        params.onNodeSelect(event, _newSelected);
      }
      models.selected.setValue(_newSelected);
    }
    lastSelectedNode.current = nodeId;
    lastSelectionWasRange.current = false;
    currentRangeSelection.current = [];
  };
  var getNodesInRange = function getNodesInRange(nodeAId, nodeBId) {
    var _findOrderInTremauxTr = findOrderInTremauxTree(instance, nodeAId, nodeBId),
      _findOrderInTremauxTr2 = _slicedToArray(_findOrderInTremauxTr, 2),
      first = _findOrderInTremauxTr2[0],
      last = _findOrderInTremauxTr2[1];
    var nodes = [first];
    var current = first;
    while (current !== last) {
      current = getNextNode(instance, current);
      nodes.push(current);
    }
    return nodes;
  };
  var handleRangeArrowSelect = function handleRangeArrowSelect(event, nodes) {
    var base = models.selected.value.slice();
    var start = nodes.start,
      next = nodes.next,
      current = nodes.current;
    if (!next || !current) {
      return;
    }
    if (currentRangeSelection.current.indexOf(current) === -1) {
      currentRangeSelection.current = [];
    }
    if (lastSelectionWasRange.current) {
      if (currentRangeSelection.current.indexOf(next) !== -1) {
        base = base.filter(function (id) {
          return id === start || id !== current;
        });
        currentRangeSelection.current = currentRangeSelection.current.filter(function (id) {
          return id === start || id !== current;
        });
      } else {
        base.push(next);
        currentRangeSelection.current.push(next);
      }
    } else {
      base.push(next);
      currentRangeSelection.current.push(current, next);
    }
    if (params.onNodeSelect) {
      params.onNodeSelect(event, base);
    }
    models.selected.setValue(base);
  };
  var handleRangeSelect = function handleRangeSelect(event, nodes) {
    var base = models.selected.value.slice();
    var start = nodes.start,
      end = nodes.end;
    // If last selection was a range selection ignore nodes that were selected.
    if (lastSelectionWasRange.current) {
      base = base.filter(function (id) {
        return currentRangeSelection.current.indexOf(id) === -1;
      });
    }
    var range = getNodesInRange(start, end);
    range = range.filter(function (node) {
      return !instance.isNodeDisabled(node);
    });
    currentRangeSelection.current = range;
    var newSelected = base.concat(range);
    newSelected = newSelected.filter(function (id, i) {
      return newSelected.indexOf(id) === i;
    });
    if (params.onNodeSelect) {
      params.onNodeSelect(event, newSelected);
    }
    models.selected.setValue(newSelected);
  };
  var selectRange = function selectRange(event, nodes) {
    var stacked = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;
    if (params.disableSelection) {
      return;
    }
    var _nodes$start = nodes.start,
      start = _nodes$start === void 0 ? lastSelectedNode.current : _nodes$start,
      end = nodes.end,
      current = nodes.current;
    if (stacked) {
      handleRangeArrowSelect(event, {
        start: start,
        next: end,
        current: current
      });
    } else if (start != null && end != null) {
      handleRangeSelect(event, {
        start: start,
        end: end
      });
    }
    lastSelectionWasRange.current = true;
  };
  var rangeSelectToFirst = function rangeSelectToFirst(event, nodeId) {
    if (!lastSelectedNode.current) {
      lastSelectedNode.current = nodeId;
    }
    var start = lastSelectionWasRange.current ? lastSelectedNode.current : nodeId;
    instance.selectRange(event, {
      start: start,
      end: getFirstNode(instance)
    });
  };
  var rangeSelectToLast = function rangeSelectToLast(event, nodeId) {
    if (!lastSelectedNode.current) {
      lastSelectedNode.current = nodeId;
    }
    var start = lastSelectionWasRange.current ? lastSelectedNode.current : nodeId;
    instance.selectRange(event, {
      start: start,
      end: getLastNode(instance)
    });
  };
  populateInstance(instance, {
    isNodeSelected: isNodeSelected,
    selectNode: selectNode,
    selectRange: selectRange,
    rangeSelectToLast: rangeSelectToLast,
    rangeSelectToFirst: rangeSelectToFirst
  });
  return {
    getRootProps: function getRootProps() {
      return {
        'aria-multiselectable': params.multiSelect
      };
    }
  };
};
useTreeViewSelection.models = {
  selected: {
    controlledProp: 'selected',
    defaultProp: 'defaultSelected'
  }
};
var DEFAULT_SELECTED = [];
useTreeViewSelection.getDefaultizedParams = function (params) {
  var _params$disableSelect, _params$multiSelect, _params$defaultSelect;
  return _extends({}, params, {
    disableSelection: (_params$disableSelect = params.disableSelection) != null ? _params$disableSelect : false,
    multiSelect: (_params$multiSelect = params.multiSelect) != null ? _params$multiSelect : false,
    defaultSelected: (_params$defaultSelect = params.defaultSelected) != null ? _params$defaultSelect : params.multiSelect ? DEFAULT_SELECTED : null
  });
};