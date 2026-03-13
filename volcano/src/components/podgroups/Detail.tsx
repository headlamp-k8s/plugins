import {
  DetailsGrid,
  Link,
  NameValueTable,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { VolcanoPodGroup } from '../../resources/podgroup';
import { getPodGroupStatusColor } from '../../utils/status';

function getProgressSection(podGroup: VolcanoPodGroup) {
  return {
    id: 'progress',
    section: (
      <SectionBox title="Progress">
        <NameValueTable
          rows={[
            { name: 'Running', value: podGroup.runningCount },
            { name: 'Succeeded', value: podGroup.succeededCount },
            { name: 'Failed', value: podGroup.failedCount },
          ]}
        />
      </SectionBox>
    ),
  };
}

function getConditionsSection(podGroup: VolcanoPodGroup) {
  if (!podGroup.status?.conditions?.length) {
    return {
      id: 'conditions',
      section: (
        <SectionBox title="Conditions">
          <NameValueTable
            rows={[
              {
                name: 'Info',
                value: 'No conditions reported by Volcano. Check Events for scheduling details.',
              },
            ]}
          />
        </SectionBox>
      ),
    };
  }

  return {
    id: 'conditions',
    section: (
      <SectionBox title="Conditions">
        {podGroup.status.conditions.map((condition, index) => (
          <NameValueTable
            key={condition.transitionID || `${condition.type}-${index}`}
            rows={[
              { name: 'Type', value: condition.type || '-' },
              { name: 'Status', value: condition.status || '-' },
              { name: 'Reason', value: condition.reason || '-' },
              { name: 'Message', value: condition.message || '-' },
              { name: 'Last Transition', value: condition.lastTransitionTime || '-' },
            ]}
          />
        ))}
      </SectionBox>
    ),
  };
}

function getMinResourcesSection(podGroup: VolcanoPodGroup) {
  if (!podGroup.spec.minResources || !Object.keys(podGroup.spec.minResources).length) return null;

  return {
    id: 'min-resources',
    section: (
      <SectionBox title="Min Resources">
        <NameValueTable
          rows={Object.entries(podGroup.spec.minResources).map(([key, value]) => ({
            name: key,
            value,
          }))}
        />
      </SectionBox>
    ),
  };
}

export default function PodGroupDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={VolcanoPodGroup}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={(podGroup: VolcanoPodGroup) =>
        podGroup && [
          {
            name: 'Status',
            value: (
              <StatusLabel status={getPodGroupStatusColor(podGroup.phase)}>
                {podGroup.phase}
              </StatusLabel>
            ),
          },
          {
            name: 'Queue',
            value: (
              <Link routeName="volcano-queue-detail" params={{ name: podGroup.queue }}>
                {podGroup.queue}
              </Link>
            ),
          },
          {
            name: 'Min Member',
            value: podGroup.minMember,
          },
          {
            name: 'Priority Class',
            value: podGroup.spec.priorityClassName || '-',
          },
        ]
      }
      extraSections={(podGroup: VolcanoPodGroup) =>
        podGroup &&
        [
          getProgressSection(podGroup),
          getConditionsSection(podGroup),
          getMinResourcesSection(podGroup),
        ].filter(Boolean)
      }
    />
  );
}
