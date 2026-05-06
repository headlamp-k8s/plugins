import {
  Link as HeadlampLink,
  ResourceListView,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KatibSuggestionClass } from '../../resources/katibSuggestion';
import { getKatibConditionStatus } from '../common/katibUtils';
import { KubeflowStatusBadge } from '../common/KubeflowStatusBadge';
import { SectionPage } from '../common/SectionPage';

/**
 * Renders the Katib Suggestion list view with request and assignment status fields.
 */
export function KatibSuggestionsList() {
  return (
    <SectionPage title="Katib Suggestions" apiPath="/apis/kubeflow.org/v1beta1/suggestions">
      <ResourceListView
        title="Katib Suggestions"
        resourceClass={KatibSuggestionClass}
        columns={[
          {
            id: 'name',
            label: 'Name',
            getValue: (item: KatibSuggestionClass) => item.metadata.name,
            render: (item: KatibSuggestionClass) => (
              <HeadlampLink
                routeName="kubeflow-katib-suggestions-detail"
                params={{ namespace: item.metadata.namespace, name: item.metadata.name }}
              >
                {item.metadata.name}
              </HeadlampLink>
            ),
          },
          'namespace',
          {
            id: 'algorithm',
            label: 'Algorithm',
            getValue: (item: KatibSuggestionClass) => item.spec.algorithm?.algorithmName || '-',
          },
          {
            id: 'requested',
            label: 'Requested',
            getValue: (item: KatibSuggestionClass) => item.spec.requests ?? '-',
          },
          {
            id: 'assigned',
            label: 'Assigned',
            getValue: (item: KatibSuggestionClass) => item.status.suggestionCount ?? 0,
          },
          {
            id: 'status',
            label: 'Status',
            getValue: (item: KatibSuggestionClass) =>
              getKatibConditionStatus(item.latestCondition).label,
            render: (item: KatibSuggestionClass) => (
              <KubeflowStatusBadge statusInfo={getKatibConditionStatus(item.latestCondition)} />
            ),
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
