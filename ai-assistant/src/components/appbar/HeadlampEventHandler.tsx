import { registerHeadlampEventCallback } from '@kinvolk/headlamp-plugin/lib';
// @todo: this HeadlampEventType import is weird. Maybe fix in headlamp to be better.
import { DefaultHeadlampEvents as HeadlampEventType } from '@kinvolk/headlamp-plugin/lib/plugin/registry';
import type { HeadlampEventPayload } from '../../pluginState';
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

  registerHeadlampEventCallback(event => {
    // Headlamp's event.data type does not expose all fields present at runtime.
    // Cast once here rather than scattering per-field `as any` assertions.
    const data = (event.data ?? {}) as Record<string, unknown>;
    const prev = (_pluginState?.event ?? {}) as Record<string, unknown>;

    if (event.type === 'headlamp.home-page-loaded') {
      _pluginState.setEvent({
        ..._pluginState.event,
        type: 'headlamp.home-page-loaded',
        clusters: data.clusters,
        errors: data.errors,
      } as HeadlampEventPayload);
    }
    if (event.type === HeadlampEventType.OBJECT_EVENTS) {
      _pluginState.setEvent({
        ..._pluginState.event,
        type: HeadlampEventType.OBJECT_EVENTS,
        objectEvent: prev.objectEvent,
        resources: data.resources,
        resourceKind: data.resourceKind,
      } as HeadlampEventPayload);
    }
    if (event.type === HeadlampEventType.DETAILS_VIEW) {
      _pluginState.setEvent({
        type: HeadlampEventType.DETAILS_VIEW,
        title: data.title,
        resource: data.resource,
        objectEvent: prev.objectEvent,
        resources: data.resources,
        resourceKind: data.resourceKind,
      } as HeadlampEventPayload);
    }
    if (event.type === HeadlampEventType.LIST_VIEW) {
      _pluginState.setEvent({
        type: HeadlampEventType.LIST_VIEW,
        title: data.title,
        resources: data.resources,
        resourceKind: data.resourceKind,
        resource: data.resource,
        objectEvent: prev.objectEvent,
      } as HeadlampEventPayload);
    }
    return null;
  });
  return null;
}
