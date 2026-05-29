import { Icon } from '@iconify/react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import type {
  GraphEdge,
  GraphNode,
} from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import type { ComponentType } from 'react';
import { useMemo } from 'react';
import JobDetail from './components/jobs/Detail';
import PodGroupDetail from './components/podgroups/Detail';
import QueueDetail from './components/queues/Detail';
import { VolcanoJob } from './resources/job';
import { VolcanoPodGroup } from './resources/podgroup';
import { VolcanoQueue } from './resources/queue';
import { getJobStatusColor, getPodGroupStatusColor, getQueueStatusColor } from './utils/status';
import {
  getPodJob,
  getRelatedPodGroup,
  getVolcanoPods,
  type VolcanoOwnerReference,
} from './utils/volcanoRelationships';
import { volcanoIconColor, volcanoIconName } from './volcanoIcon';

const volcanoMapIcon = (
  <Icon icon={volcanoIconName} width="100%" height="100%" color={volcanoIconColor} />
);

const PodResource = K8s.ResourceClasses.Pod;

type GraphNodeStatus = 'error' | 'success' | 'warning';
type GraphDetailsComponentProps = { node: GraphNode };
type VolcanoMapKubeObject = KubeObject & {
  metadata: {
    uid: string;
    ownerReferences?: VolcanoOwnerReference[];
  };
};

function makeVolcanoNode(
  kubeObject: VolcanoMapKubeObject,
  weight: number,
  subtitle: string,
  status: GraphNodeStatus | undefined,
  detailsComponent: ComponentType<GraphDetailsComponentProps>
) {
  return {
    id: kubeObject.metadata.uid,
    kubeObject,
    subtitle,
    status,
    weight,
    detailsComponent,
  };
}

function makeQueueNode(queue: VolcanoQueue) {
  return makeVolcanoNode(
    queue,
    5000,
    'Volcano Queue',
    getQueueStatusColor(queue.state),
    ({ node }: GraphDetailsComponentProps) => (
      <QueueDetail
        name={node.kubeObject.jsonData.metadata.name}
        cluster={node.kubeObject.cluster}
      />
    )
  );
}

function makeJobNode(job: VolcanoJob) {
  return makeVolcanoNode(
    job,
    4000,
    'Volcano Job',
    getJobStatusColor(job.phase),
    ({ node }: GraphDetailsComponentProps) => (
      <JobDetail
        namespace={node.kubeObject.jsonData.metadata.namespace}
        name={node.kubeObject.jsonData.metadata.name}
        cluster={node.kubeObject.cluster}
      />
    )
  );
}

function makePodGroupNode(podGroup: VolcanoPodGroup) {
  return makeVolcanoNode(
    podGroup,
    3000,
    'Volcano PodGroup',
    getPodGroupStatusColor(podGroup.phase),
    ({ node }: GraphDetailsComponentProps) => (
      <PodGroupDetail
        namespace={node.kubeObject.jsonData.metadata.namespace}
        name={node.kubeObject.jsonData.metadata.name}
        cluster={node.kubeObject.cluster}
      />
    )
  );
}

function makePodNode(pod: InstanceType<typeof PodResource>) {
  return {
    id: pod.metadata.uid,
    kubeObject: pod,
  };
}

function makeKubeToKubeEdge(from: VolcanoMapKubeObject, to: VolcanoMapKubeObject): GraphEdge {
  return {
    id: `${from.metadata.uid}-${to.metadata.uid}`,
    source: from.metadata.uid,
    target: to.metadata.uid,
  };
}

function makePodToJobEdge(pod: InstanceType<typeof PodResource>, job: VolcanoJob): GraphEdge {
  return {
    id: `${pod.metadata.uid}-${job.metadata.uid}`,
    source: pod.metadata.uid,
    target: job.metadata.uid,
  };
}

function getQueueHierarchyEdges(queues: VolcanoQueue[]) {
  const edges: GraphEdge[] = [];

  queues.forEach(queue => {
    const parentQueueName = queue.spec.parent;
    if (!parentQueueName) {
      return;
    }

    const parentQueue = queues.find(candidate => candidate.metadata.name === parentQueueName);
    if (parentQueue) {
      edges.push(makeKubeToKubeEdge(parentQueue, queue));
    }
  });

  return edges;
}

function getJobToPodGroupEdges(jobs: VolcanoJob[], podGroups: VolcanoPodGroup[]) {
  const edges: GraphEdge[] = [];

  jobs.forEach(job => {
    const podGroup = getRelatedPodGroup(job, podGroups);
    if (podGroup) {
      edges.push(makeKubeToKubeEdge(job, podGroup));
    }
  });

  return edges;
}

function getPodToJobEdges(jobs: VolcanoJob[], pods: InstanceType<typeof PodResource>[]) {
  const edges: GraphEdge[] = [];

  pods.forEach(pod => {
    const job = getPodJob(pod, jobs);
    if (job) {
      edges.push(makePodToJobEdge(pod, job));
    }
  });

  return edges;
}

const queueSource = {
  id: 'volcano-queues',
  label: 'queues',
  icon: volcanoMapIcon,
  useData() {
    const [queues] = VolcanoQueue.useList();

    return useMemo(() => {
      if (!queues) {
        return null;
      }

      return {
        nodes: queues.map(queue => makeQueueNode(queue)),
      };
    }, [queues]);
  },
};

const queueHierarchySource = {
  id: 'volcano-queue-hierarchy',
  label: 'queue hierarchy',
  icon: volcanoMapIcon,
  useData() {
    const [queues] = VolcanoQueue.useList();

    return useMemo(() => {
      if (!queues) {
        return null;
      }

      return {
        edges: getQueueHierarchyEdges(queues),
      };
    }, [queues]);
  },
};

const jobSource = {
  id: 'volcano-jobs',
  label: 'jobs',
  icon: volcanoMapIcon,
  useData() {
    const [jobs] = VolcanoJob.useList();

    return useMemo(() => {
      if (!jobs) {
        return null;
      }

      return {
        nodes: jobs.map(job => makeJobNode(job)),
      };
    }, [jobs]);
  },
};

const podGroupSource = {
  id: 'volcano-podgroups',
  label: 'podgroups',
  icon: volcanoMapIcon,
  useData() {
    const [podGroups] = VolcanoPodGroup.useList();
    const [jobs] = VolcanoJob.useList();

    return useMemo(() => {
      if (!podGroups || !jobs) {
        return null;
      }

      return {
        nodes: podGroups.map(podGroup => makePodGroupNode(podGroup)),
        edges: getJobToPodGroupEdges(jobs, podGroups),
      };
    }, [podGroups, jobs]);
  },
};

const podSource = {
  id: 'volcano-pods',
  label: 'pods',
  icon: volcanoMapIcon,
  useData() {
    const [pods] = PodResource.useList();
    const [jobs] = VolcanoJob.useList();

    return useMemo(() => {
      if (!pods || !jobs) {
        return null;
      }

      const volcanoPods = getVolcanoPods(pods).filter(pod => getPodJob(pod, jobs));

      return {
        nodes: volcanoPods.map(pod => makePodNode(pod)),
        edges: getPodToJobEdges(jobs, volcanoPods),
      };
    }, [pods, jobs]);
  },
};

export const volcanoSource = {
  id: 'volcano',
  label: 'Volcano',
  icon: volcanoMapIcon,
  sources: [queueSource, jobSource, podGroupSource, podSource, queueHierarchySource],
};
