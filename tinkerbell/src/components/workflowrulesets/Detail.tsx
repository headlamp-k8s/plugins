import {
  DetailsGrid,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { WorkflowRuleSet } from '../../resources/workflowRuleSet';
import { fallback, renderUnknownValue } from '../common/detailHelpers';
import type { TinkerbellDetailProps } from '../common/detailTypes';

/**
 * Gets the template reference from WorkflowRuleSet workflow config.
 *
 * @param item - WorkflowRuleSet resource to inspect.
 * @returns Template reference/name when present.
 */
function getTemplateRef(item: WorkflowRuleSet): string {
  const workflow = item.spec?.workflow;
  const template = workflow?.template ?? workflow?.templateRef ?? workflow?.ref;

  if (typeof template === 'string') {
    return fallback(template);
  }

  return fallback(template?.ref ?? template?.name ?? workflow?.templateName);
}

/**
 * Renders the Tinkerbell WorkflowRuleSet detail view.
 *
 * @returns WorkflowRuleSet detail page with rules and workflow config.
 */
export function WorkflowRuleSetDetail(props: TinkerbellDetailProps = {}) {
  const params = useParams<{ namespace: string; name: string }>();
  const namespace = props.namespace ?? params.namespace;
  const name = props.name ?? params.name;

  return (
    <DetailsGrid
      resourceType={WorkflowRuleSet}
      name={name}
      namespace={namespace}
      cluster={props.cluster}
      extraInfo={item =>
        item
          ? [
              { name: 'Rules', value: fallback(item.spec?.rules?.length) },
              { name: 'Template', value: getTemplateRef(item) },
            ]
          : []
      }
      extraSections={item =>
        item
          ? [
              {
                id: 'tinkerbell.workflowruleset-rules',
                section: (
                  <SectionBox title="Rules">
                    <SimpleTable
                      columns={[
                        { label: 'Index', getter: row => fallback(row.index) },
                        { label: 'Rule', getter: row => renderUnknownValue(row.rule) },
                      ]}
                      data={(item.spec?.rules ?? []).map((rule, index) => ({
                        index: index + 1,
                        rule,
                      }))}
                    />
                  </SectionBox>
                ),
              },
              {
                id: 'tinkerbell.workflowruleset-template',
                section: (
                  <SectionBox title="Template">
                    <NameValueTable rows={[{ name: 'Template', value: getTemplateRef(item) }]} />
                  </SectionBox>
                ),
              },
            ]
          : []
      }
    />
  );
}
