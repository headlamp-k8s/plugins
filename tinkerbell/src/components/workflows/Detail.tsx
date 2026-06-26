import {
  ConditionsSection,
  DetailsGrid,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { normalizeState } from '../../resources/common';
import { Workflow } from '../../resources/workflow';
import { booleanValue, fallback, renderRecordSection, statusValue } from '../common/detailHelpers';

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
                value: statusValue(normalizeState(item.status?.state ?? item.status?.currentState)),
              },
              { name: 'Hardware', value: fallback(item.spec?.hardwareRef) },
              { name: 'Template', value: fallback(item.spec?.templateRef) },
              { name: 'Disabled', value: booleanValue(item.spec?.disabled) },
              { name: 'Agent ID', value: fallback(item.status?.agentID) },
              { name: 'Global Timeout', value: fallback(item.status?.globalTimeout) },
              {
                name: 'Execution Stop',
                value: booleanValue(item.status?.globalExecutionStop),
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
                          name: 'Spec Netboot',
                          value: booleanValue(item.spec?.bootOptions?.netboot),
                        },
                        {
                          name: 'Spec ISO Boot',
                          value: booleanValue(item.spec?.bootOptions?.isoboot),
                        },
                        {
                          name: 'Status Netboot',
                          value: booleanValue(item.status?.bootOptions?.netboot),
                        },
                        {
                          name: 'Status ISO Boot',
                          value: booleanValue(item.status?.bootOptions?.isoboot),
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
                          value: statusValue(normalizeState(item.status?.currentState)),
                        },
                        { name: 'Agent ID', value: fallback(item.status?.agentID) },
                        { name: 'Global Timeout', value: fallback(item.status?.globalTimeout) },
                        {
                          name: 'Global Execution Stop',
                          value: booleanValue(item.status?.globalExecutionStop),
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
                        { label: 'State', getter: row => statusValue(normalizeState(row.state)) },
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
                        { label: 'Started', getter: row => fallback(row.startedAt) },
                        { label: 'Seconds', getter: row => fallback(row.seconds) },
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
