import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { normalizeState } from '../../resources/common';
import { Workflow, WorkflowActionStatus, WorkflowTaskStatus } from '../../resources/workflow';
import { booleanValue, fallback, renderRecordSection, statusValue } from '../common/detailHelpers';

/**
 * Gets a task state from its actions when the task has no direct state field.
 *
 * @param task - Workflow task status entry.
 * @returns Normalized task state.
 */
function getTaskState(task: WorkflowTaskStatus): string {
  if (task.state) {
    return normalizeState(task.state);
  }

  const actionStates = task.actions?.map(action => action.state).filter(Boolean) ?? [];
  if (actionStates.some(state => state === 'RUNNING')) {
    return normalizeState('RUNNING');
  }
  if (actionStates.some(state => state === 'FAILED')) {
    return normalizeState('FAILED');
  }
  if (actionStates.length && actionStates.every(state => state === 'SUCCESS')) {
    return normalizeState('SUCCESS');
  }

  return normalizeState(undefined);
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
              { name: 'Disabled', value: booleanValue(item.spec?.disabled) },
              { name: 'Agent ID', value: fallback(item.status?.agentID) },
              { name: 'Global Timeout', value: fallback(item.status?.globalTimeout) },
              {
                name: 'Global Execution Stop',
                value: fallback(item.status?.globalExecutionStop),
              },
            ]
          : []
      }
      extraSections={item =>
        item
          ? [
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
                        {
                          name: 'Toggle Netboot',
                          value: booleanValue(item.spec?.bootOptions?.toggleAllowNetboot),
                        },
                        {
                          name: 'Spec ISO Boot',
                          value: booleanValue(item.spec?.bootOptions?.isoboot),
                        },
                        {
                          name: 'Netboot Enabled',
                          value: booleanValue(item.status?.bootOptions?.netboot),
                        },
                        {
                          name: 'AllowNetboot Toggled True',
                          value: booleanValue(item.status?.bootOptions?.allowNetboot?.toggledTrue),
                        },
                        {
                          name: 'AllowNetboot Toggled False',
                          value: booleanValue(item.status?.bootOptions?.allowNetboot?.toggledFalse),
                        },
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
                        { label: 'Action', getter: row => fallback(row.name) },
                        { label: 'State', getter: row => statusValue(normalizeState(row.state)) },
                        { label: 'Message', getter: row => fallback(row.message) },
                        { label: 'Started', getter: row => getActionStart(row) },
                        { label: 'Stopped', getter: row => fallback(row.executionStop) },
                        {
                          label: 'Duration',
                          getter: row => fallback(row.executionDuration ?? row.seconds),
                        },
                      ]}
                      data={
                        item.status?.tasks?.flatMap(task =>
                          (task.actions ?? []).map(action => ({
                            taskName: task.name,
                            ...action,
                          }))
                        ) ?? []
                      }
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tinkerbell.workflow-template-rendering',
                section: renderRecordSection('Template Rendering', item.status?.templateRendering),
              },
              {
                id: 'tinkerbell.workflow-conditions',
                section: <ConditionsSection resource={item.jsonData} />,
              },
            ]
          : []
      }
    />
  );
}
