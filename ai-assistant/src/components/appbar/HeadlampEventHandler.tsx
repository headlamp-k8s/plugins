import { registerHeadlampEventCallback } from '@kinvolk/headlamp-plugin/lib';
import type { HeadlampEventPayload, ProjectSummary } from '../../pluginState';
import { useGlobalState } from '../../pluginState';

const HEADLAMP_EVENT_TYPE = {
  DETAILS_VIEW: 'headlamp.details-view',
  LIST_VIEW: 'headlamp.list-view',
  OBJECT_EVENTS: 'headlamp.object-events',
  PROJECT_LIST_VIEW: 'headlamp.project-list-view',
  PROJECT_DETAILS_VIEW: 'headlamp.project-details-view',
  PROJECT_DETAILS_TAB_CHANGE: 'headlamp.project-details-tab-change',
  CREATE_PROJECT: 'headlamp.create-project',
  DELETE_PROJECT: 'headlamp.delete-project',
} as const;

/** Tab labels can be React nodes, so fall back to the serializable tab id. */
function projectTabName(tab: unknown): string | undefined {
  const { id, label } = (tab ?? {}) as { id?: string; label?: unknown };
  return typeof label === 'string' ? label : id;
}

function projectTitle(project: ProjectSummary | undefined): string {
  return project?.id ? `Project: ${project.id}` : 'Project';
}

/**
 * Headless component that registers Headlamp event callbacks.
 *
 * Listens for page-level navigation events (home page loaded, object events,
 * details view, list view, and the project list/details/tab-change and
 * create/delete events) and mirrors them into the plugin's global state so the
 * AI Assistant can generate context-aware prompts.
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
    if (event.type === HEADLAMP_EVENT_TYPE.PROJECT_LIST_VIEW) {
      _pluginState.setEvent({
        type: HEADLAMP_EVENT_TYPE.PROJECT_LIST_VIEW,
        title: 'Projects',
        projects: (data.projects ?? []) as ProjectSummary[],
      } as HeadlampEventPayload);
    }
    if (event.type === HEADLAMP_EVENT_TYPE.PROJECT_DETAILS_VIEW) {
      const project = data.project as ProjectSummary | undefined;
      _pluginState.setEvent({
        type: HEADLAMP_EVENT_TYPE.PROJECT_DETAILS_VIEW,
        title: projectTitle(project),
        project,
        resources: data.resources,
      } as HeadlampEventPayload);
    }
    if (event.type === HEADLAMP_EVENT_TYPE.PROJECT_DETAILS_TAB_CHANGE) {
      const project = data.project as ProjectSummary | undefined;
      _pluginState.setEvent({
        type: HEADLAMP_EVENT_TYPE.PROJECT_DETAILS_TAB_CHANGE,
        title: projectTitle(project),
        project,
        projectTab: projectTabName(data.tab),
        previousProjectTab: projectTabName(data.previousTab),
        resources: data.resources,
      } as HeadlampEventPayload);
    }
    if (event.type === HEADLAMP_EVENT_TYPE.CREATE_PROJECT) {
      const project = data.project as ProjectSummary | undefined;
      _pluginState.setEvent({
        type: HEADLAMP_EVENT_TYPE.CREATE_PROJECT,
        title: projectTitle(project),
        project,
      } as HeadlampEventPayload);
    }
    if (event.type === HEADLAMP_EVENT_TYPE.DELETE_PROJECT) {
      const project = data.project as ProjectSummary | undefined;
      _pluginState.setEvent({
        type: HEADLAMP_EVENT_TYPE.DELETE_PROJECT,
        title: projectTitle(project),
        project,
        deleteNamespaces: data.deleteNamespaces as boolean | undefined,
      } as HeadlampEventPayload);
    }
    return null;
  });
  return null;
}
