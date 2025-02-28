import * as React from 'react';
import { TimerBasedCleanupTracking } from '../utils/cleanupTracking/TimerBasedCleanupTracking';
import { FinalizationRegistryBasedCleanupTracking } from '../utils/cleanupTracking/FinalizationRegistryBasedCleanupTracking';
// We use class to make it easier to detect in heap snapshots by name
class ObjectToBeRetainedByReact {}

// Based on https://github.com/Bnaya/use-dispose-uncommitted/blob/main/src/finalization-registry-based-impl.ts
// Check https://github.com/facebook/react/issues/15317 to get more information
export function createUseInstanceEventHandler(registryContainer) {
  let cleanupTokensCounter = 0;
  return function useInstanceEventHandler(instance, eventName, handler) {
    if (registryContainer.registry === null) {
      registryContainer.registry = typeof FinalizationRegistry !== 'undefined' ? new FinalizationRegistryBasedCleanupTracking() : new TimerBasedCleanupTracking();
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
export const unstable_resetCleanupTracking = () => {
  registryContainer.registry?.reset();
  registryContainer.registry = null;
};
export const useInstanceEventHandler = createUseInstanceEventHandler(registryContainer);