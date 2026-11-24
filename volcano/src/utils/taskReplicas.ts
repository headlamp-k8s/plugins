/**
 * Replica helpers for Volcano Job tasks.
 * The Go API marks `replicas` as omitempty, so a task with 0 replicas has no such field.
 */

type TaskWithReplicas = { replicas?: number };

/**
 * Returns the replica count of a task, treating a missing value as 0.
 *
 * @param task Task whose replicas should be read.
 * @returns Number of replicas, or 0 when the field is absent.
 */
export function getTaskReplicas(task: TaskWithReplicas): number {
  return task.replicas ?? 0;
}

/**
 * Sums the replicas of all tasks, treating a missing value as 0.
 *
 * @param tasks Tasks to sum, if any.
 * @returns Total number of replicas across tasks.
 */
export function getTotalReplicas(tasks?: TaskWithReplicas[]): number {
  return tasks?.reduce((total, task) => total + getTaskReplicas(task), 0) ?? 0;
}
