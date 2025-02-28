import _extends from "@babel/runtime/helpers/esm/extends";
import * as React from 'react';
import useForkRef from '@mui/utils/useForkRef';
import { DEFAULT_TREE_VIEW_CONTEXT_VALUE } from '../TreeViewProvider/TreeViewContext';
import { useTreeViewModels } from './useTreeViewModels';
import { TREE_VIEW_CORE_PLUGINS } from '../corePlugins';
export const useTreeView = inParams => {
  const plugins = [...TREE_VIEW_CORE_PLUGINS, ...inParams.plugins];
  const params = plugins.reduce((acc, plugin) => {
    if (plugin.getDefaultizedParams) {
      return plugin.getDefaultizedParams(acc);
    }
    return acc;
  }, inParams);
  const models = useTreeViewModels(plugins, params);
  const instanceRef = React.useRef({});
  const instance = instanceRef.current;
  const innerRootRef = React.useRef(null);
  const handleRootRef = useForkRef(innerRootRef, inParams.rootRef);
  const [state, setState] = React.useState(() => {
    const temp = {};
    plugins.forEach(plugin => {
      if (plugin.getInitialState) {
        Object.assign(temp, plugin.getInitialState(params));
      }
    });
    return temp;
  });
  const rootPropsGetters = [];
  let contextValue = DEFAULT_TREE_VIEW_CONTEXT_VALUE;
  const runPlugin = plugin => {
    const pluginResponse = plugin({
      instance,
      params,
      state,
      setState,
      rootRef: innerRootRef,
      models
    }) || {};
    if (pluginResponse.getRootProps) {
      rootPropsGetters.push(pluginResponse.getRootProps);
    }
    if (pluginResponse.contextValue) {
      contextValue = pluginResponse.contextValue;
    }
  };
  plugins.forEach(runPlugin);
  const getRootProps = (otherHandlers = {}) => {
    const rootProps = _extends({
      role: 'tree',
      tabIndex: 0
    }, otherHandlers, {
      ref: handleRootRef
    });
    rootPropsGetters.forEach(rootPropsGetter => {
      Object.assign(rootProps, rootPropsGetter(otherHandlers));
    });
    return rootProps;
  };
  return {
    getRootProps,
    rootRef: handleRootRef,
    contextValue
  };
};