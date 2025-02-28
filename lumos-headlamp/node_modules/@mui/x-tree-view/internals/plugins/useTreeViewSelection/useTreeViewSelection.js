import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import { populateInstance, getNextNode, getFirstNode, getLastNode } from '../../useTreeView/useTreeView.utils';
import { findOrderInTremauxTree } from './useTreeViewSelection.utils';
export const useTreeViewSelection = ({
  instance,
  params,
  models
}) => {
  const lastSelectedNode = React.useRef(null);
  const lastSelectionWasRange = React.useRef(false);
  const currentRangeSelection = React.useRef([]);
  const isNodeSelected = nodeId => Array.isArray(models.selected.value) ? models.selected.value.indexOf(nodeId) !== -1 : models.selected.value === nodeId;
  const selectNode = (event, nodeId, multiple = false) => {
    if (params.disableSelection) {
      return;
    }
    if (multiple) {
      if (Array.isArray(models.selected.value)) {
        let newSelected;
        if (models.selected.value.indexOf(nodeId) !== -1) {
          newSelected = models.selected.value.filter(id => id !== nodeId);
        } else {
          newSelected = [nodeId].concat(models.selected.value);
        }
        if (params.onNodeSelect) {
          params.onNodeSelect(event, newSelected);
        }
        models.selected.setValue(newSelected);
      }
    } else {
      const newSelected = params.multiSelect ? [nodeId] : nodeId;
      if (params.onNodeSelect) {
        params.onNodeSelect(event, newSelected);
      }
      models.selected.setValue(newSelected);
    }
    lastSelectedNode.current = nodeId;
    lastSelectionWasRange.current = false;
    currentRangeSelection.current = [];
  };
  const getNodesInRange = (nodeAId, nodeBId) => {
    const [first, last] = findOrderInTremauxTree(instance, nodeAId, nodeBId);
    const nodes = [first];
    let current = first;
    while (current !== last) {
      current = getNextNode(instance, current);
      nodes.push(current);
    }
    return nodes;
  };
  const handleRangeArrowSelect = (event, nodes) => {
    let base = models.selected.value.slice();
    const {
      start,
      next,
      current
    } = nodes;
    if (!next || !current) {
      return;
    }
    if (currentRangeSelection.current.indexOf(current) === -1) {
      currentRangeSelection.current = [];
    }
    if (lastSelectionWasRange.current) {
      if (currentRangeSelection.current.indexOf(next) !== -1) {
        base = base.filter(id => id === start || id !== current);
        currentRangeSelection.current = currentRangeSelection.current.filter(id => id === start || id !== current);
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
  const handleRangeSelect = (event, nodes) => {
    let base = models.selected.value.slice();
    const {
      start,
      end
    } = nodes;
    // If last selection was a range selection ignore nodes that were selected.
    if (lastSelectionWasRange.current) {
      base = base.filter(id => currentRangeSelection.current.indexOf(id) === -1);
    }
    let range = getNodesInRange(start, end);
    range = range.filter(node => !instance.isNodeDisabled(node));
    currentRangeSelection.current = range;
    let newSelected = base.concat(range);
    newSelected = newSelected.filter((id, i) => newSelected.indexOf(id) === i);
    if (params.onNodeSelect) {
      params.onNodeSelect(event, newSelected);
    }
    models.selected.setValue(newSelected);
  };
  const selectRange = (event, nodes, stacked = false) => {
    if (params.disableSelection) {
      return;
    }
    const {
      start = lastSelectedNode.current,
      end,
      current
    } = nodes;
    if (stacked) {
      handleRangeArrowSelect(event, {
        start,
        next: end,
        current
      });
    } else if (start != null && end != null) {
      handleRangeSelect(event, {
        start,
        end
      });
    }
    lastSelectionWasRange.current = true;
  };
  const rangeSelectToFirst = (event, nodeId) => {
    if (!lastSelectedNode.current) {
      lastSelectedNode.current = nodeId;
    }
    const start = lastSelectionWasRange.current ? lastSelectedNode.current : nodeId;
    instance.selectRange(event, {
      start,
      end: getFirstNode(instance)
    });
  };
  const rangeSelectToLast = (event, nodeId) => {
    if (!lastSelectedNode.current) {
      lastSelectedNode.current = nodeId;
    }
    const start = lastSelectionWasRange.current ? lastSelectedNode.current : nodeId;
    instance.selectRange(event, {
      start,
      end: getLastNode(instance)
    });
  };
  populateInstance(instance, {
    isNodeSelected,
    selectNode,
    selectRange,
    rangeSelectToLast,
    rangeSelectToFirst
  });
  return {
    getRootProps: () => ({
      'aria-multiselectable': params.multiSelect
    })
  };
};
useTreeViewSelection.models = {
  selected: {
    controlledProp: 'selected',
    defaultProp: 'defaultSelected'
  }
};
const DEFAULT_SELECTED = [];
useTreeViewSelection.getDefaultizedParams = params => {
  var _params$disableSelect, _params$multiSelect, _params$defaultSelect;
  return _extends({}, params, {
    disableSelection: (_params$disableSelect = params.disableSelection) != null ? _params$disableSelect : false,
    multiSelect: (_params$multiSelect = params.multiSelect) != null ? _params$multiSelect : false,
    defaultSelected: (_params$defaultSelect = params.defaultSelected) != null ? _params$defaultSelect : params.multiSelect ? DEFAULT_SELECTED : null
  });
};