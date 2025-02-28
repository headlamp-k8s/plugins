import * as React from 'react';
import { EventManager } from '../../utils/EventManager';
import { populateInstance } from '../../useTreeView/useTreeView.utils';
const isSyntheticEvent = event => {
  return event.isPropagationStopped !== undefined;
};

/**
 * Plugin responsible for the registration of the nodes defined as JSX children of the TreeView.
 * When we will have both a SimpleTreeView using JSX children and a TreeView using a data prop,
 * this plugin will only be used by SimpleTreeView.
 */
export const useTreeViewInstanceEvents = ({
  instance
}) => {
  const [eventManager] = React.useState(() => new EventManager());
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
  populateInstance(instance, {
    $$publishEvent: publishEvent,
    $$subscribeEvent: subscribeEvent
  });
};