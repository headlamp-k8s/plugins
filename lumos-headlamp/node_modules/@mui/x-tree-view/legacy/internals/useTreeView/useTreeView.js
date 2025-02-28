import _extends from "@babel/runtime/helpers/esm/extends";
import _slicedToArray from "@babel/runtime/helpers/esm/slicedToArray";
import _toConsumableArray from "@babel/runtime/helpers/esm/toConsumableArray";
import * as React from 'react';
import useForkRef from '@mui/utils/useForkRef';
import { DEFAULT_TREE_VIEW_CONTEXT_VALUE } from '../TreeViewProvider/TreeViewContext';
import { useTreeViewModels } from './useTreeViewModels';
import { TREE_VIEW_CORE_PLUGINS } from '../corePlugins';
export var useTreeView = function useTreeView(inParams) {
  var plugins = [].concat(_toConsumableArray(TREE_VIEW_CORE_PLUGINS), _toConsumableArray(inParams.plugins));
  var params = plugins.reduce(function (acc, plugin) {
    if (plugin.getDefaultizedParams) {
      return plugin.getDefaultizedParams(acc);
    }
    return acc;
  }, inParams);
  var models = useTreeViewModels(plugins, params);
  var instanceRef = React.useRef({});
  var instance = instanceRef.current;
  var innerRootRef = React.useRef(null);
  var handleRootRef = useForkRef(innerRootRef, inParams.rootRef);
  var _React$useState = React.useState(function () {
      var temp = {};
      plugins.forEach(function (plugin) {
        if (plugin.getInitialState) {
          _extends(temp, plugin.getInitialState(params));
        }
      });
      return temp;
    }),
    _React$useState2 = _slicedToArray(_React$useState, 2),
    state = _React$useState2[0],
    setState = _React$useState2[1];
  var rootPropsGetters = [];
  var contextValue = DEFAULT_TREE_VIEW_CONTEXT_VALUE;
  var runPlugin = function runPlugin(plugin) {
    var pluginResponse = plugin({
      instance: instance,
      params: params,
      state: state,
      setState: setState,
      rootRef: innerRootRef,
      models: models
    }) || {};
    if (pluginResponse.getRootProps) {
      rootPropsGetters.push(pluginResponse.getRootProps);
    }
    if (pluginResponse.contextValue) {
      contextValue = pluginResponse.contextValue;
    }
  };
  plugins.forEach(runPlugin);
  var getRootProps = function getRootProps() {
    var otherHandlers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var rootProps = _extends({
      role: 'tree',
      tabIndex: 0
    }, otherHandlers, {
      ref: handleRootRef
    });
    rootPropsGetters.forEach(function (rootPropsGetter) {
      _extends(rootProps, rootPropsGetter(otherHandlers));
    });
    return rootProps;
  };
  return {
    getRootProps: getRootProps,
    rootRef: handleRootRef,
    contextValue: contextValue
  };
};