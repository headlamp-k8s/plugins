import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { normalizeState } from '../../resources/common';
import { Workflow, WorkflowActionStatus } from '../../resources/workflow';
import { booleanValue, fallback, renderRecordSection, statusValue } from '../common/detailHelpers';
import { getTaskState } from './helpers';

/** Workflow action row enriched with its parent task name. */
interface WorkflowActionRow extends WorkflowActionStatus {
  /** Name of the task containing this action. */
  taskName?: string;
}

/**
 * Gets the preferred start timestamp for a workflow action.
 *
 * @param action - Workflow action status entry.
 * @returns Start timestamp or fallback.
 */
function getActionStart(action: WorkflowActionStatus): string {
  return fallback(action.executionStart ?? action.startedAt);
}

/**
 * Flattens workflow task actions into table rows.
 *
 * @param item - Workflow resource to inspect.
 * @returns Action rows with parent task names.
 */
function getWorkflowActions(item: Workflow): WorkflowActionRow[] {
  return (
    item.status?.tasks?.flatMap(task =>
      (task.actions ?? []).map(action => ({
        taskName: task.name,
        ...action,
      }))
    ) ?? []
  );
}

/**
 * Gets failed workflow actions for a focused troubleshooting summary.
 *
 * @param item - Workflow resource to inspect.
 * @returns Failed action rows.
 */
function getFailedActions(item: Workflow): WorkflowActionRow[] {
  return getWorkflowActions(item).filter(action => normalizeState(action.state) === 'Failed');
}

/**
 * Gets the workflow boot mode from requested or observed boot options.
 *
 * @param item - Workflow resource to inspect.
 * @returns Human-readable boot mode.
 */
function getBootMode(item: Workflow): string {
  if (item.spec?.bootOptions?.isoboot || item.status?.bootOptions?.isoboot) {
    return 'ISO Boot';
  }

  if (
    item.spec?.bootOptions?.netboot ||
    item.status?.bootOptions?.netboot ||
    item.spec?.bootOptions?.toggleAllowNetboot
  ) {
    return 'Netboot';
  }

  return fallback(undefined);
}

/**
 * Summarizes the requested allow-netboot toggle and observed controller updates.
 *
 * @param item - Workflow resource to inspect.
 * @returns Human-readable toggle summary.
 */
function getToggleAllowNetboot(item: Workflow): string {
  const toggleRequested = item.spec?.bootOptions?.toggleAllowNetboot;
  const allowNetboot = item.status?.bootOptions?.allowNetboot;

  if (!toggleRequested) {
    return booleanValue(toggleRequested);
  }

  if (allowNetboot?.toggledTrue && allowNetboot?.toggledFalse) {
    return 'Yes (enabled, restored)';
  }

  if (allowNetboot?.toggledTrue) {
    return 'Yes (enabled)';
  }

  if (allowNetboot?.toggledFalse) {
    return 'Yes (restored)';
  }

  return 'Yes';
}

/**
 * Renders template rendering status in the shape reported by Tinkerbell.
 *
 * @param value - Template rendering status or detail object.
 * @returns Template rendering section or undefined when there is no data.
 */
function renderTemplateRendering(value: string | Record<string, any> | undefined) {
  if (!value) {
    return undefined;
  }

  if (typeof value === 'string') {
    return (
      <SectionBox title="Template Rendering">
        <NameValueTable rows={[{ name: 'Status', value: statusValue(normalizeState(value)) }]} />
      </SectionBox>
    );
  }

  return renderRecordSection('Template Rendering', value);
}

/**
 * Renders the Tinkerbell Workflow detail view.
 *
 * @returns Workflow detail page with references, status, tasks, and actions.
 */
export function WorkflowDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={Workflow}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item =>
        item
          ? [
              {
                name: 'Status',
                value: statusValue(
                  normalizeState(item.status?.state ?? item.status?.currentState?.state)
                ),
              },
              { name: 'Hardware', value: fallback(item.spec?.hardwareRef) },
              { name: 'Template', value: fallback(item.spec?.templateRef) },
              { name: 'Disabled', value: booleanValue(item.spec?.disabled ?? false) },
              { name: 'Agent ID', value: fallback(item.status?.agentID) },
              { name: 'Global Timeout', value: fallback(item.status?.globalTimeout) },
              {
                name: 'Global Execution Stop',
                value: fallback(item.status?.globalExecutionStop),
              },
            ]
          : []
      }
      extraSections={item => {
        if (!item) {
          return [];
        }

        const actions = getWorkflowActions(item);
        const failedActions = getFailedActions(item);

        return [
          {
            id: 'tinkerbell.workflow-references',
            section: (
              <SectionBox title="References">
                <NameValueTable
                  rows={[
                    { name: 'Hardware', value: fallback(item.spec?.hardwareRef) },
                    { name: 'Template', value: fallback(item.spec?.templateRef) },
                  ]}
                />
              </SectionBox>
            ),
          },
          {
            id: 'tinkerbell.workflow-boot-options',
            section: (
              <SectionBox title="Boot Options">
                <NameValueTable
                  rows={[
                    { name: 'Boot Mode', value: getBootMode(item) },
                    { name: 'Toggle Allow Netboot', value: getToggleAllowNetboot(item) },
                  ]}
                />
              </SectionBox>
            ),
          },
          {
            id: 'tinkerbell.workflow-hardware-map',
            section: renderRecordSection('Hardware Map', item.spec?.hardwareMap),
          },
          {
            id: 'tinkerbell.workflow-status',
            section: (
              <SectionBox title="Workflow Status">
                <NameValueTable
                  rows={[
                    { name: 'State', value: statusValue(normalizeState(item.status?.state)) },
                    {
                      name: 'Current State',
                      value: statusValue(normalizeState(item.status?.currentState?.state)),
                    },
                    {
                      name: 'Current Task',
                      value: fallback(item.status?.currentState?.taskName),
                    },
                    {
                      name: 'Current Action',
                      value: fallback(item.status?.currentState?.actionName),
                    },
                    { name: 'Agent ID', value: fallback(item.status?.agentID) },
                    { name: 'Global Timeout', value: fallback(item.status?.globalTimeout) },
                    {
                      name: 'Global Execution Stop',
                      value: fallback(item.status?.globalExecutionStop),
                    },
                  ]}
                />
              </SectionBox>
            ),
          },
          failedActions.length > 0 && {
            id: 'tinkerbell.workflow-failed-actions',
            section: (
              <SectionBox title="Failed Action Summary">
                <SimpleTable
                  columns={[
                    { label: 'Task', getter: row => fallback(row.taskName) },
                    { label: 'Name', getter: row => fallback(row.name) },
                    { label: 'State', getter: row => statusValue(normalizeState(row.state)) },
                    { label: 'Message', getter: row => fallback(row.message) },
                    { label: 'Started', getter: row => getActionStart(row) },
                    { label: 'Stopped', getter: row => fallback(row.executionStop) },
                    {
                      label: 'Duration',
                      getter: row => fallback(row.executionDuration ?? row.seconds),
                    },
                  ]}
                  data={failedActions}
                />
              </SectionBox>
            ),
          },
          {
            id: 'tinkerbell.workflow-tasks',
            section: (
              <SectionBox title="Tasks">
                <SimpleTable
                  columns={[
                    { label: 'Name', getter: row => fallback(row.name) },
                    { label: 'State', getter: row => statusValue(getTaskState(row)) },
                    { label: 'Actions', getter: row => fallback(row.actions?.length) },
                  ]}
                  data={item.status?.tasks ?? []}
                />
              </SectionBox>
            ),
          },
          {
            id: 'tinkerbell.workflow-actions',
            section: (
              <SectionBox title="Actions">
                <SimpleTable
                  columns={[
                    { label: 'Task', getter: row => fallback(row.taskName) },
                    { label: 'Name', getter: row => fallback(row.name) },
                    { label: 'State', getter: row => statusValue(normalizeState(row.state)) },
                    { label: 'Message', getter: row => fallback(row.message) },
                    { label: 'Started', getter: row => getActionStart(row) },
                    { label: 'Stopped', getter: row => fallback(row.executionStop) },
                    {
                      label: 'Duration',
                      getter: row => fallback(row.executionDuration ?? row.seconds),
                    },
                  ]}
                  data={actions}
                />
              </SectionBox>
            ),
          },
          item.status?.templateRendering && {
            id: 'tinkerbell.workflow-template-rendering',
            section: renderTemplateRendering(item.status?.templateRendering),
          },
          item.conditions?.length && {
            id: 'tinkerbell.workflow-conditions',
            section: <ConditionsSection resource={item.jsonData} />,
          },
        ].filter(Boolean);
      }}
    />
  );
}
