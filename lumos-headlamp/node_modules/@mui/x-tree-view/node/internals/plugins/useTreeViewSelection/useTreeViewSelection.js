"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useTreeViewSelection = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var React = _interopRequireWildcard(require("react"));
var _useTreeView = require("../../useTreeView/useTreeView.utils");
var _useTreeViewSelection = require("./useTreeViewSelection.utils");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const useTreeViewSelection = ({
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
    const [first, last] = (0, _useTreeViewSelection.findOrderInTremauxTree)(instance, nodeAId, nodeBId);
    const nodes = [first];
    let current = first;
    while (current !== last) {
      current = (0, _useTreeView.getNextNode)(instance, current);
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
      end: (0, _useTreeView.getFirstNode)(instance)
    });
  };
  const rangeSelectToLast = (event, nodeId) => {
    if (!lastSelectedNode.current) {
      lastSelectedNode.current = nodeId;
    }
    const start = lastSelectionWasRange.current ? lastSelectedNode.current : nodeId;
    instance.selectRange(event, {
      start,
      end: (0, _useTreeView.getLastNode)(instance)
    });
  };
  (0, _useTreeView.populateInstance)(instance, {
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
exports.useTreeViewSelection = useTreeViewSelection;
useTreeViewSelection.models = {
  selected: {
    controlledProp: 'selected',
    defaultProp: 'defaultSelected'
  }
};
const DEFAULT_SELECTED = [];
useTreeViewSelection.getDefaultizedParams = params => (0, _extends2.default)({}, params, {
  disableSelection: params.disableSelection ?? false,
  multiSelect: params.multiSelect ?? false,
  defaultSelected: params.defaultSelected ?? (params.multiSelect ? DEFAULT_SELECTED : null)
});