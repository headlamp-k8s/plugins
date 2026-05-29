import { VolcanoJob } from '../resources/job';
import { VolcanoPodGroup } from '../resources/podgroup';
import { isVolcanoJobApiVersion } from './volcanoApi';
import { volcanoJobNameLabel, volcanoJobNamespaceLabel } from './volcanoLabels';

/**
 * Owner reference fields used to identify Volcano Job ownership.
 */
export type VolcanoOwnerReference = {
  /** API version of the referenced owner. */
  apiVersion?: string;
  /** Kubernetes kind of the referenced owner. */
  kind?: string;
  /** UID of the referenced owner. */
  uid?: string;
};

/**
 * Minimal Pod-like shape needed to resolve Volcano Job relationships.
 */
export type VolcanoPodLike = {
  metadata: {
    /** Labels used as a fallback when owner references are unavailable. */
    labels?: Record<string, string>;
    /** Owner references used to identify Volcano-controlled pods. */
    ownerReferences?: VolcanoOwnerReference[];
    /** Pod namespace. */
    namespace?: string;
  };
};

/**
 * Reports whether an owner reference points to a Volcano Job.
 *
 * @param ownerReference Owner reference to inspect.
 * @returns `true` when the reference targets a Volcano Job API version and kind.
 */
export function isVolcanoJobOwnerReference(ownerReference: VolcanoOwnerReference) {
  return ownerReference.kind === 'Job' && isVolcanoJobApiVersion(ownerReference.apiVersion);
}

/**
 * Reports whether an owner reference points to the given Volcano Job.
 *
 * @param ownerReference Owner reference to inspect.
 * @param job Volcano Job expected to own the object.
 * @returns `true` when the owner reference targets the Job UID.
 */
export function referencesVolcanoJob(ownerReference: VolcanoOwnerReference, job: VolcanoJob) {
  return isVolcanoJobOwnerReference(ownerReference) && ownerReference.uid === job.metadata.uid;
}

/**
 * Reports whether an object has a Volcano Job owner reference.
 *
 * @param kubeObject Object whose owner references are inspected.
 * @returns `true` when any owner reference points to a Volcano Job.
 */
export function hasVolcanoJobOwnerReference(kubeObject: VolcanoPodLike) {
  return (
    kubeObject.metadata.ownerReferences?.some(ownerReference =>
      isVolcanoJobOwnerReference(ownerReference)
    ) || false
  );
}

/**
 * Filters pods to those related to Volcano Jobs.
 *
 * Pods are matched by Volcano Job owner reference first, or by Volcano job
 * labels when owner references are unavailable.
 *
 * @param pods Pods to filter.
 * @returns Pods associated with Volcano Jobs.
 */
export function getVolcanoPods<T extends VolcanoPodLike>(pods: T[]) {
  return pods.filter(pod => {
    const labels = pod.metadata.labels || {};
    const jobName = labels[volcanoJobNameLabel];
    const jobNamespace = labels[volcanoJobNamespaceLabel];
    const hasVolcanoJobLabels = Boolean(jobName && jobNamespace);

    return hasVolcanoJobOwnerReference(pod) || hasVolcanoJobLabels;
  });
}

/**
 * Finds the Volcano Job related to a pod.
 *
 * Owner references are preferred because they identify the owning Job by UID.
 * Volcano job name and namespace labels are used as a fallback.
 *
 * @param pod Pod whose owning Job should be resolved.
 * @param jobs Candidate Volcano Jobs.
 * @returns Matching Volcano Job, or `null` when no match is found.
 */
export function getPodJob<T extends VolcanoPodLike>(pod: T, jobs: VolcanoJob[]) {
  const byOwnerReference = jobs.find(job =>
    pod.metadata.ownerReferences?.some(ownerReference => referencesVolcanoJob(ownerReference, job))
  );

  if (byOwnerReference) {
    return byOwnerReference;
  }

  const labels = pod.metadata.labels || {};
  const jobName = labels[volcanoJobNameLabel];
  const jobNamespace = labels[volcanoJobNamespaceLabel];

  if (!jobName || !jobNamespace) {
    return null;
  }

  return (
    jobs.find(
      candidate =>
        candidate.metadata.name === jobName && candidate.metadata.namespace === jobNamespace
    ) || null
  );
}

/**
 * Finds the PodGroup related to a Volcano Job.
 *
 * Owner references are preferred. Name-based fallbacks keep older Volcano
 * objects connected when owner references are absent.
 *
 * @param job Volcano Job whose PodGroup should be resolved.
 * @param podGroups Candidate PodGroups.
 * @returns Matching PodGroup, or `null` when no match is found.
 */
export function getRelatedPodGroup(
  job: VolcanoJob,
  podGroups: VolcanoPodGroup[] | null | undefined
): VolcanoPodGroup | null {
  if (!podGroups?.length) {
    return null;
  }

  const byOwnerReference = podGroups.find(podGroup =>
    podGroup.metadata.ownerReferences?.some(ownerReference =>
      referencesVolcanoJob(ownerReference, job)
    )
  );

  if (byOwnerReference) {
    return byOwnerReference;
  }

  // Owner refs are authoritative; name fallback keeps older objects connected when refs are absent.
  const jobName = job.metadata.name;
  const jobUid = job.metadata.uid;

  if (jobName && jobUid) {
    const canonicalName = `${jobName}-${jobUid}`;
    const byCanonicalName = podGroups.find(podGroup => podGroup.metadata.name === canonicalName);

    if (byCanonicalName) {
      return byCanonicalName;
    }
  }

  if (jobName) {
    return podGroups.find(podGroup => podGroup.metadata.name === jobName) || null;
  }

  return null;
}
