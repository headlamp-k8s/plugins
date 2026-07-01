import { registerHeadlampEventCallback } from '@kinvolk/headlamp-plugin/lib';
// @todo: this HeadlampEventType import is weird. Maybe fix in headlamp to be better.
import { DefaultHeadlampEvents as HeadlampEventType } from '@kinvolk/headlamp-plugin/lib/plugin/registry';
import { useGlobalState } from '../../pluginState';

/**
 * Headless component that registers Headlamp event callbacks.
 *
 * Listens for page-level navigation events (home page loaded, object events,
 * details view, list view) and mirrors them into the plugin's global state so
 * the AI Assistant can generate context-aware prompts.
 *
 * This component renders nothing (`null`); it exists solely for its side
 * effects.
 */
export default function HeadlampEventHandler() {
  const _pluginState = useGlobalState();

  // @todo: these "any" casts are all suspicious and also bugs (at least in the types maybe more).
  // @todo: the data being used is not in the event type definitions. Check the definitions and this code.
  registerHeadlampEventCallback(event => {
    // @todo: headlamp.home-page-loaded does not exist in headlampEventSlice or anywhere in headlamp.
    if (event.type === 'headlamp.home-page-loaded') {
      _pluginState.setEvent({
        ..._pluginState.event,
        type: 'headlamp.home-page-loaded',
        clusters: (event.data as any).clusters,
        errors: (event.data as any).errors,
      });
    }
    if (event.type === HeadlampEventType.OBJECT_EVENTS) {
      // @todo: some of these fields need fixing
      _pluginState.setEvent({
        ..._pluginState.event,
        type: HeadlampEventType.OBJECT_EVENTS,
        objectEvent: (_pluginState?.event as any)?.objectEvent,
        resources: (event.data as any).resources,
        resourceKind: (event.data as any).resourceKind,
      });
    }
    if (event.type === HeadlampEventType.DETAILS_VIEW) {
      // @todo: some of these fields need fixing
      _pluginState.setEvent({
        type: HeadlampEventType.DETAILS_VIEW,
        title: (event.data as any).title,
        resource: (event.data as any).resource,
        objectEvent: (_pluginState?.event as any)?.objectEvent,
        resources: (event.data as any).resources,
        resourceKind: (event.data as any).resourceKind,
      });
    }
    if (event.type === HeadlampEventType.LIST_VIEW) {
      // @todo: some of these fields need fixing
      _pluginState.setEvent({
        type: HeadlampEventType.LIST_VIEW,
        title: (event.data as any).title,
        resources: (event.data as any).resources,
        resourceKind: (event.data as any).resourceKind,
        resource: (event.data as any).resource,
        objectEvent: (_pluginState?.event as any)?.objectEvent,
      });
    }
    return null;
  });
  return null;
}
