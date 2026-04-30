import {
  ConditionsTable,
  DetailsGrid,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { KatibSuggestionClass } from '../../resources/katibSuggestion';
import { KubeflowJsonViewerAction } from '../common/KubeflowJsonViewerAction';
import { SectionPage } from '../common/SectionPage';

/**
 * Renders the Katib Suggestion detail view with counts, conditions, and raw JSON access.
 */
export function KatibSuggestionsDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <SectionPage title="Katib Suggestion Detail" apiPath="/apis/kubeflow.org/v1beta1/suggestions">
      <DetailsGrid
        resourceType={KatibSuggestionClass}
        name={name as string}
        namespace={namespace}
        withEvents
        actions={item =>
          item && [
            {
              id: 'kubeflow.katib-suggestion-json',
              action: (
                <KubeflowJsonViewerAction
                  title="View Raw JSON"
                  value={item.jsonData}
                  activityId={`json-katib-suggestion-${item.metadata.namespace}-${item.metadata.name}`}
                />
              ),
            },
          ]
        }
        extraInfo={item =>
          item && [
            { name: 'Algorithm', value: item.spec.algorithm?.algorithmName || '-' },
            { name: 'Requested Suggestions', value: item.spec.requests ?? '-' },
            { name: 'Assigned Suggestions', value: item.status.suggestionCount ?? 0 },
          ]
        }
        extraSections={item =>
          item
            ? [
                ...(item.conditions.length > 0
                  ? [
                      {
                        id: 'conditions',
                        section: (
                          <SectionBox title="Conditions">
                            <ConditionsTable resource={item.jsonData} />
                          </SectionBox>
                        ),
                      },
                    ]
                  : []),
              ]
            : []
        }
      />
    </SectionPage>
  );
}
