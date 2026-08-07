import { KueueCondition } from './clusterQueue';

export function getWorkloadDetailRouteParams(namespace: string, name: string) {
  return {
    namespace,
    name,
  };
}

export function renderQueueName(queueName?: string) {
  return queueName || '-';
}

export function renderPriorityClassName(priorityClassName?: string) {
  return priorityClassName || '-';
}

export function renderWorkloadStatus(condition?: KueueCondition) {
  if (!condition) {
    return 'Pending';
  }

  if (condition.type === 'Admitted' && condition.status === 'True') {
    return 'Admitted';
  }
  
  if (condition.type === 'Evicted' && condition.status === 'True') {
    return 'Evicted';
  }

  return condition.type;
}
