"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createUseInstanceEventHandler = createUseInstanceEventHandler;
exports.useInstanceEventHandler = exports.unstable_resetCleanupTracking = void 0;
var React = _interopRequireWildcard(require("react"));
var _TimerBasedCleanupTracking = require("../utils/cleanupTracking/TimerBasedCleanupTracking");
var _FinalizationRegistryBasedCleanupTracking = require("../utils/cleanupTracking/FinalizationRegistryBasedCleanupTracking");
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
// We use class to make it easier to detect in heap snapshots by name
class ObjectToBeRetainedByReact {}

// Based on https://github.com/Bnaya/use-dispose-uncommitted/blob/main/src/finalization-registry-based-impl.ts
// Check https://github.com/facebook/react/issues/15317 to get more information
function createUseInstanceEventHandler(registryContainer) {
  let cleanupTokensCounter = 0;
  return function useInstanceEventHandler(instance, eventName, handler) {
    if (registryContainer.registry === null) {
      registryContainer.registry = typeof FinalizationRegistry !== 'undefined' ? new _FinalizationRegistryBasedCleanupTracking.FinalizationRegistryBasedCleanupTracking() : new _TimerBasedCleanupTracking.TimerBasedCleanupTracking();
    }
    const [objectRetainedByReact] = React.useState(new ObjectToBeRetainedByReact());
    const subscription = React.useRef(null);
    const handlerRef = React.useRef();
    handlerRef.current = handler;
    const cleanupTokenRef = React.useRef(null);
    if (!subscription.current && handlerRef.current) {
      const enhancedHandler = (params, event) => {
        if (!event.defaultMuiPrevented) {
          handlerRef.current?.(params, event);
        }
      };
      subscription.current = instance.$$subscribeEvent(eventName, enhancedHandler);
      cleanupTokensCounter += 1;
      cleanupTokenRef.current = {
        cleanupToken: cleanupTokensCounter
      };
      registryContainer.registry.register(objectRetainedByReact,
      // The callback below will be called once this reference stops being retained
      () => {
        subscription.current?.();
        subscription.current = null;
        cleanupTokenRef.current = null;
      }, cleanupTokenRef.current);
    } else if (!handlerRef.current && subscription.current) {
      subscription.current();
      subscription.current = null;
      if (cleanupTokenRef.current) {
        registryContainer.registry.unregister(cleanupTokenRef.current);
        cleanupTokenRef.current = null;
      }
    }
    React.useEffect(() => {
      if (!subscription.current && handlerRef.current) {
        const enhancedHandler = (params, event) => {
          if (!event.defaultMuiPrevented) {
            handlerRef.current?.(params, event);
          }
        };
        subscription.current = instance.$$subscribeEvent(eventName, enhancedHandler);
      }
      if (cleanupTokenRef.current && registryContainer.registry) {
        // If the effect was called, it means that this render was committed
        // so we can trust the cleanup function to remove the listener.
        registryContainer.registry.unregister(cleanupTokenRef.current);
        cleanupTokenRef.current = null;
      }
      return () => {
        subscription.current?.();
        subscription.current = null;
      };
    }, [instance, eventName]);
  };
}
const registryContainer = {
  registry: null
};

// eslint-disable-next-line @typescript-eslint/naming-convention
const unstable_resetCleanupTracking = () => {
  registryContainer.registry?.reset();
  registryContainer.registry = null;
};
exports.unstable_resetCleanupTracking = unstable_resetCleanupTracking;
const useInstanceEventHandler = exports.useInstanceEventHandler = createUseInstanceEventHandler(registryContainer);