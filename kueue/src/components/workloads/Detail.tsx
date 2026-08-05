import {
  ConditionsSection,
  DetailsGrid,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { PodSet, Workload } from '../../resources/workload';
import { renderWorkloadStatus } from '../../resources/workloadFormatters';

function getPodSetsSection(workload: Workload) {
  const podSets = workload.podSets;
  if (!podSets || podSets.length === 0) {
    return null;
  }

  return {
    id: 'pod-sets',
    section: (
      <SectionBox title="Pod Sets">
        <SimpleTable
          data={podSets}
          columns={[
            {
              label: 'Name',
              getter: (row: PodSet) => row.name,
            },
            {
              label: 'Count',
              getter: (row: PodSet) => row.count,
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

function getConditionsSection(workload: Workload) {
  if (!workload.conditions.length) {
    return null;
  }

  return {
    id: 'conditions',
    section: <ConditionsSection resource={workload.jsonData} />,
  };
}

export default function WorkloadDetail() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  return (
    <DetailsGrid
      resourceType={Workload}
      namespace={namespace}
      name={name}
      withEvents
      extraInfo={workload =>
        workload
          ? [
              {
                name: 'Local Queue',
                value: workload.queueName,
              },
              {
                name: 'Cluster Queue',
                value: workload.clusterQueueName,
              },
              {
                name: 'Priority Class',
                value: workload.priorityClassName,
              },
              {
                name: 'Priority',
                value: workload.priority,
              },
              {
                name: 'Status',
                value: renderWorkloadStatus(workload.conditions),
              },
            ]
          : []
      }
      extraSections={workload =>
        workload
          ? [getPodSetsSection(workload), getConditionsSection(workload)].filter(
              (s): s is NonNullable<typeof s> => s !== null
            )
          : []
      }
    />
  );
}
