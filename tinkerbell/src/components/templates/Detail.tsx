import {
  DetailsGrid,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { Template } from '../../resources/template';
import { fallback, renderTextSection } from '../common/detailHelpers';
import { parseTemplateData } from './helpers';

/**
 * Renders the Tinkerbell Template detail view.
 *
 * @returns Template detail page with summary, parsed tasks, actions, and raw data.
 */
export function TemplateDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={Template}
      name={name}
      namespace={namespace}
      extraInfo={item => {
        const parsedTemplate = parseTemplateData(item?.data);

        return item
          ? [
              { name: 'Template Name', value: fallback(parsedTemplate.name) },
              { name: 'Global Timeout', value: fallback(parsedTemplate.globalTimeout) },
              { name: 'Tasks', value: fallback(parsedTemplate.tasks.length) },
              { name: 'Total Actions', value: fallback(parsedTemplate.actions.length) },
            ]
          : [];
      }}
      extraSections={item => {
        const parsedTemplate = parseTemplateData(item?.data);

        return item
          ? [
              {
                id: 'tinkerbell.template-tasks',
                section: (
                  <SectionBox title="Tasks">
                    <SimpleTable
                      columns={[
                        { label: 'Name', getter: row => row.name },
                        { label: 'Worker', getter: row => fallback(row.worker) },
                        { label: 'Total Actions', getter: row => fallback(row.actionCount) },
                        { label: 'Volumes', getter: row => fallback(row.volumeCount) },
                      ]}
                      data={parsedTemplate.tasks}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tinkerbell.template-actions',
                section: (
                  <SectionBox title="Actions">
                    <SimpleTable
                      columns={[
                        { label: 'Task', getter: row => row.taskName },
                        { label: 'Action', getter: row => row.name },
                        {
                          label: 'Type',
                          getter: row =>
                            fallback(row.alternatives?.length ? 'Conditional' : 'Direct'),
                        },
                        { label: 'Condition', getter: row => fallback(row.condition) },
                        { label: 'Image', getter: row => fallback(row.image) },
                        { label: 'Timeout', getter: row => fallback(row.timeout) },
                      ]}
                      data={parsedTemplate.actions}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tinkerbell.template-data',
                section: renderTextSection('Raw Template Data', item.data),
              },
            ]
          : [];
      }}
    />
  );
}
