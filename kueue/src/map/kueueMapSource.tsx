import { Icon } from '@iconify/react';
import type { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ComponentType, useMemo } from 'react';
import ClusterQueueDetail from '../components/clusterqueues/Detail';
import CohortDetail from '../components/cohorts/Detail';
import LocalQueueDetail from '../components/localqueues/Detail';
import ResourceFlavorDetail from '../components/resourceflavors/Detail';
import WorkloadDetail from '../components/workloads/Detail';
import { ClusterQueue } from '../resources/clusterQueue';
import { Cohort } from '../resources/cohort';
import { LocalQueue } from '../resources/localQueue';
import { ResourceFlavor } from '../resources/resourceFlavor';
import { Workload } from '../resources/workload';
import { getOwnerEdges, getReferenceEdges } from './kueueMapEdges';

export const kueueIconName = 'mdi:queue-first-in-last-out';

const kueueMapIcon = <Icon icon={kueueIconName} width="100%" height="100%" />;

type DetailProps = { name?: string; namespace?: string; cluster?: string };

/** Show a node's Kueue detail page in the Map's side panel. */
function makeNodeDetails(Detail: ComponentType<DetailProps>) {
  return function KueueNodeDetails({ node }: { node: GraphNode }) {
    const object = node.kubeObject as KubeObject;
    return (
      <Detail
        name={object.metadata.name}
        namespace={object.metadata.namespace}
        cluster={object.cluster}
      />
    );
  };
}

function makeNodes(objects: KubeObject[], detailsComponent: ComponentType<{ node: GraphNode }>) {
  return objects.map(object => ({ id: object.metadata.uid, kubeObject: object, detailsComponent }));
}

const workloadDetails = makeNodeDetails(WorkloadDetail);
const localQueueDetails = makeNodeDetails(LocalQueueDetail);
const clusterQueueDetails = makeNodeDetails(ClusterQueueDetail);
const cohortDetails = makeNodeDetails(CohortDetail);
const resourceFlavorDetails = makeNodeDetails(ResourceFlavorDetail);

const workloadSource = {
  id: 'kueue-workloads',
  label: 'Workloads',
  icon: kueueMapIcon,
  useData() {
    const [workloads] = Workload.useList();
    const [localQueues] = LocalQueue.useList();

    return useMemo(() => {
      if (!workloads) {
        return null;
      }

      return {
        nodes: makeNodes(workloads, workloadDetails),
        edges: [
          ...getOwnerEdges(workloads),
          ...getReferenceEdges(
            workloads,
            localQueues ?? [],
            workload => [workload.queueName],
            true
          ),
        ],
      };
    }, [workloads, localQueues]);
  },
};

const localQueueSource = {
  id: 'kueue-localqueues',
  label: 'LocalQueues',
  icon: kueueMapIcon,
  useData() {
    const [localQueues] = LocalQueue.useList();
    const [clusterQueues] = ClusterQueue.useList();

    return useMemo(() => {
      if (!localQueues) {
        return null;
      }

      return {
        nodes: makeNodes(localQueues, localQueueDetails),
        edges: getReferenceEdges(localQueues, clusterQueues ?? [], localQueue => [
          localQueue.clusterQueueName,
        ]),
      };
    }, [localQueues, clusterQueues]);
  },
};

const clusterQueueSource = {
  id: 'kueue-clusterqueues',
  label: 'ClusterQueues',
  icon: kueueMapIcon,
  useData() {
    const [clusterQueues] = ClusterQueue.useList();
    const [cohorts] = Cohort.useList();
    const [resourceFlavors] = ResourceFlavor.useList();

    return useMemo(() => {
      if (!clusterQueues) {
        return null;
      }

      return {
        nodes: makeNodes(clusterQueues, clusterQueueDetails),
        edges: [
          ...getReferenceEdges(clusterQueues, cohorts ?? [], clusterQueue => [
            clusterQueue.spec.cohortName,
          ]),
          ...getReferenceEdges(
            clusterQueues,
            resourceFlavors ?? [],
            clusterQueue => clusterQueue.referencedFlavorNames
          ),
        ],
      };
    }, [clusterQueues, cohorts, resourceFlavors]);
  },
};

const cohortSource = {
  id: 'kueue-cohorts',
  label: 'Cohorts',
  icon: kueueMapIcon,
  useData() {
    const [cohorts] = Cohort.useList();

    return useMemo(() => {
      if (!cohorts) {
        return null;
      }

      return {
        nodes: makeNodes(cohorts, cohortDetails),
        edges: getReferenceEdges(cohorts, cohorts, cohort => [cohort.spec.parentName]),
      };
    }, [cohorts]);
  },
};

const resourceFlavorSource = {
  id: 'kueue-resourceflavors',
  label: 'ResourceFlavors',
  icon: kueueMapIcon,
  useData() {
    const [resourceFlavors] = ResourceFlavor.useList();

    return useMemo(() => {
      if (!resourceFlavors) {
        return null;
      }

      return { nodes: makeNodes(resourceFlavors, resourceFlavorDetails) };
    }, [resourceFlavors]);
  },
};

export const kueueMapSource = {
  id: 'kueue',
  label: 'Kueue',
  icon: kueueMapIcon,
  sources: [
    workloadSource,
    localQueueSource,
    clusterQueueSource,
    cohortSource,
    resourceFlavorSource,
  ],
};
