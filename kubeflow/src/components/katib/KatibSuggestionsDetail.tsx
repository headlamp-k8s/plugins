import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { KatibSuggestionClass } from '../../resources/katibSuggestion';
import { KubeflowConditionsSection } from '../common/KubeflowConditionsSection';
import { KubeflowJsonSection } from '../common/KubeflowJsonSection';
import { SectionPage } from '../common/SectionPage';

/**
 * Renders the Katib Suggestion detail view with counts, conditions, and raw spec data.
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
                        section: <KubeflowConditionsSection conditions={item.conditions} />,
                      },
                    ]
                  : []),
                {
                  id: 'spec-preview',
                  section: <KubeflowJsonSection title="Raw Spec Preview" value={item.spec} />,
                },
              ]
            : []
        }
      />
    </SectionPage>
  );
}
