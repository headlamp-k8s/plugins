import {
  DetailsGrid,
  Link,
  NameValueTable,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { VolcanoQueue } from '../../resources/queue';
import { getQueueStatusColor } from '../../utils/status';

function getCapacitySection(queue: VolcanoQueue) {
  if (!queue.spec.capability) return null;

  return {
    id: 'capacity',
    section: (
      <SectionBox title="Capacity Limits">
        <NameValueTable
          rows={Object.entries(queue.spec.capability).map(([key, value]) => ({
            name: key,
            value: value,
          }))}
        />
      </SectionBox>
    ),
  };
}

function getAllocatedSection(queue: VolcanoQueue) {
  if (!queue.status?.allocated) return null;

  return {
    id: 'allocated',
    section: (
      <SectionBox title="Allocated Resources">
        <NameValueTable
          rows={Object.entries(queue.status.allocated).map(([key, value]) => ({
            name: key,
            value: value,
          }))}
        />
      </SectionBox>
    ),
  };
}

export default function QueueDetail() {
  const { name } = useParams<{ name: string }>();

  return (
    <DetailsGrid
      resourceType={VolcanoQueue}
      name={name}
      withEvents
      extraInfo={(queue: VolcanoQueue) =>
        queue && [
          {
            name: 'State',
            value: (
              <StatusLabel status={getQueueStatusColor(queue.state)}>{queue.state}</StatusLabel>
            ),
          },
          { name: 'Weight', value: queue.weight },
          { name: 'Priority', value: queue.spec.priority || 0 },
          { name: 'Reclaimable', value: queue.spec.reclaimable !== false ? 'Yes' : 'No' },
          {
            name: 'Parent Queue',
            value: queue.spec.parent ? (
              <Link routeName="volcano-queue-detail" params={{ name: queue.spec.parent }}>
                {queue.spec.parent}
              </Link>
            ) : (
              '-'
            ),
          },
        ]
      }
      extraSections={(queue: VolcanoQueue) =>
        queue && [getCapacitySection(queue), getAllocatedSection(queue)].filter(Boolean)
      }
    />
  );
}
