"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useTreeView = void 0;
var _extends2 = _interopRequireDefault(require("@babel/runtime/helpers/extends"));
var React = _interopRequireWildcard(require("react"));
var _useForkRef = _interopRequireDefault(require("@mui/utils/useForkRef"));
var _TreeViewContext = require("../TreeViewProvider/TreeViewContext");
var _useTreeViewModels = require("./useTreeViewModels");
var _corePlugins = require("../corePlugins");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const useTreeView = inParams => {
  const plugins = [..._corePlugins.TREE_VIEW_CORE_PLUGINS, ...inParams.plugins];
  const params = plugins.reduce((acc, plugin) => {
    if (plugin.getDefaultizedParams) {
      return plugin.getDefaultizedParams(acc);
    }
    return acc;
  }, inParams);
  const models = (0, _useTreeViewModels.useTreeViewModels)(plugins, params);
  const instanceRef = React.useRef({});
  const instance = instanceRef.current;
  const innerRootRef = React.useRef(null);
  const handleRootRef = (0, _useForkRef.default)(innerRootRef, inParams.rootRef);
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
  let contextValue = _TreeViewContext.DEFAULT_TREE_VIEW_CONTEXT_VALUE;
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
    const rootProps = (0, _extends2.default)({
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
exports.useTreeView = useTreeView;