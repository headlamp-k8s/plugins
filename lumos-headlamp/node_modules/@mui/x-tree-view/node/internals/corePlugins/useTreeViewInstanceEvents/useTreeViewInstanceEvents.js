"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useTreeViewInstanceEvents = void 0;
var React = _interopRequireWildcard(require("react"));
var _EventManager = require("../../utils/EventManager");
var _useTreeView = require("../../useTreeView/useTreeView.utils");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
const isSyntheticEvent = event => {
  return event.isPropagationStopped !== undefined;
};

/**
 * Plugin responsible for the registration of the nodes defined as JSX children of the TreeView.
 * When we will have both a SimpleTreeView using JSX children and a TreeView using a data prop,
 * this plugin will only be used by SimpleTreeView.
 */
const useTreeViewInstanceEvents = ({
  instance
}) => {
  const [eventManager] = React.useState(() => new _EventManager.EventManager());
  const publishEvent = React.useCallback((...args) => {
    const [name, params, event = {}] = args;
    event.defaultMuiPrevented = false;
    if (isSyntheticEvent(event) && event.isPropagationStopped()) {
      return;
    }
    eventManager.emit(name, params, event);
  }, [eventManager]);
  const subscribeEvent = React.useCallback((event, handler) => {
    eventManager.on(event, handler);
    return () => {
      eventManager.removeListener(event, handler);
    };
  }, [eventManager]);
  (0, _useTreeView.populateInstance)(instance, {
    $$publishEvent: publishEvent,
    $$subscribeEvent: subscribeEvent
  });
};
exports.useTreeViewInstanceEvents = useTreeViewInstanceEvents;