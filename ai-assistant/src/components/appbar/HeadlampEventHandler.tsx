import { registerHeadlampEventCallback } from '@kinvolk/headlamp-plugin/lib';
import type { HeadlampEventPayload } from '../../pluginState';
import { useGlobalState } from '../../pluginState';

const HEADLAMP_EVENT_TYPE = {
  DETAILS_VIEW: 'headlamp.details-view',
  LIST_VIEW: 'headlamp.list-view',
  OBJECT_EVENTS: 'headlamp.object-events',
} as const;

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
    if (event.type === HEADLAMP_EVENT_TYPE.OBJECT_EVENTS) {
      _pluginState.setEvent({
        ..._pluginState.event,
        type: HEADLAMP_EVENT_TYPE.OBJECT_EVENTS,
        objectEvent: prev.objectEvent,
        resources: data.resources,
        resourceKind: data.resourceKind,
      } as HeadlampEventPayload);
    }
    if (event.type === HEADLAMP_EVENT_TYPE.DETAILS_VIEW) {
      _pluginState.setEvent({
        type: HEADLAMP_EVENT_TYPE.DETAILS_VIEW,
        title: data.title,
        resource: data.resource,
        objectEvent: prev.objectEvent,
        resources: data.resources,
        resourceKind: data.resourceKind,
      } as HeadlampEventPayload);
    }
    if (event.type === HEADLAMP_EVENT_TYPE.LIST_VIEW) {
      _pluginState.setEvent({
        type: HEADLAMP_EVENT_TYPE.LIST_VIEW,
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
