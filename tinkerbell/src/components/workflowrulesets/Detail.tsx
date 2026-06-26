import {
  DetailsGrid,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { WorkflowRuleSet } from '../../resources/workflowRuleSet';
import { fallback, renderRecordSection, renderUnknownValue } from '../common/detailHelpers';

/**
 * Renders the Tinkerbell WorkflowRuleSet detail view.
 *
 * @returns WorkflowRuleSet detail page with rules and workflow config.
 */
export function WorkflowRuleSetDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={WorkflowRuleSet}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={item =>
        item
          ? [
              { name: 'Rules', value: fallback(item.spec?.rules?.length) },
              {
                name: 'Workflow Config',
                value: fallback(item.spec?.workflow ? 'Configured' : undefined),
              },
            ]
          : []
      }
      extraSections={item =>
        item
          ? [
              {
                id: 'tinkerbell.workflowruleset-summary',
                section: (
                  <SectionBox title="WorkflowRuleSet Summary">
                    <NameValueTable
                      rows={[
                        { name: 'Rules', value: fallback(item.spec?.rules?.length) },
                        {
                          name: 'Workflow Config',
                          value: fallback(item.spec?.workflow ? 'Configured' : undefined),
                        },
                      ]}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tinkerbell.workflowruleset-rules',
                section: (
                  <SectionBox title="Rules">
                    <SimpleTable
                      columns={[
                        { label: 'Name', getter: row => fallback(row.name) },
                        { label: 'Rule', getter: row => renderUnknownValue(row) },
                      ]}
                      data={item.spec?.rules ?? []}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tinkerbell.workflowruleset-workflow',
                section: renderRecordSection('Workflow Config', item.spec?.workflow),
              },
            ]
          : []
      }
    />
  );
}
