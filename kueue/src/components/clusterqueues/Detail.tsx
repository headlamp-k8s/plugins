import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { ClusterQueue } from '../../resources/clusterQueue';

export default function ClusterQueueDetail() {
  const { name } = useParams<{ name: string }>();

  return (
    <DetailsGrid
      resourceType={ClusterQueue}
      name={name}
      withEvents
      extraInfo={clusterQueue =>
        clusterQueue
          ? [
              {
                name: 'Cohort',
                value: clusterQueue.cohortName,
              },
              {
                name: 'Queueing Strategy',
                value: clusterQueue.queueingStrategy,
              },
              {
                name: 'Stop Policy',
                value: clusterQueue.stopPolicy,
              },
              {
                name: 'Namespace Selector',
                value: clusterQueue.namespaceSelectorDisplay,
              },
              {
                name: 'Pending Workloads',
                value: clusterQueue.pendingWorkloads,
              },
              {
                name: 'Admitted Workloads',
                value: clusterQueue.admittedWorkloads,
              },
              {
                name: 'Reserving Workloads',
                value: clusterQueue.reservingWorkloads,
              },
              {
                name: 'Status',
                value: clusterQueue.statusDisplay,
              },
              {
                name: 'Conditions',
                value: clusterQueue.conditionsDisplay,
              },
              {
                name: 'Resource Groups',
                value: clusterQueue.resourceGroupsDetailDisplay,
              },
              {
                name: 'Referenced ResourceFlavors',
                value: clusterQueue.referencedFlavorNamesDisplay,
              },
              {
                name: 'Preemption',
                value: clusterQueue.preemptionDisplay,
              },
              {
                name: 'Admission Checks',
                value: clusterQueue.admissionChecksDisplay,
              },
              {
                name: 'Flavor Fungibility',
                value: clusterQueue.flavorFungibilityDisplay,
              },
              {
                name: 'Flavor Reservations',
                value: clusterQueue.flavorsReservationDisplay,
              },
              {
                name: 'Flavor Usage',
                value: clusterQueue.flavorsUsageDisplay,
              },
              {
                name: 'Fair Sharing',
                value: clusterQueue.fairSharingDisplay,
              },
              {
                name: 'Admission Scope',
                value: clusterQueue.admissionScopeDisplay,
              },
              {
                name: 'Concurrent Admission',
                value: clusterQueue.concurrentAdmissionPolicyDisplay,
              },
            ]
          : []
      }
    />
  );
}
