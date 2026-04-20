import { groupJobPodIssues, type JobPodIssue } from './pods';

function makeIssue({
  podName,
  containerName,
  reason,
  message,
}: {
  podName: string;
  containerName?: string;
  reason: string;
  message?: string;
}): JobPodIssue {
  return {
    pod: { metadata: { name: podName } } as JobPodIssue['pod'],
    podName,
    containerName,
    reason,
    message,
  };
}

describe('groupJobPodIssues', () => {
  it('groups issues with the same reason and message', () => {
    const groupedIssues = groupJobPodIssues([
      makeIssue({
        podName: 'job-worker-0',
        containerName: 'main',
        reason: 'ImagePullBackOff',
        message: 'failed to pull image',
      }),
      makeIssue({
        podName: 'job-worker-1',
        containerName: 'main',
        reason: 'ImagePullBackOff',
        message: 'failed to pull image',
      }),
    ]);

    expect(groupedIssues).toHaveLength(1);
    expect(groupedIssues[0].pods.map(pod => pod.podName)).toEqual(['job-worker-0', 'job-worker-1']);
    expect(groupedIssues[0].containerNames).toEqual(['main']);
  });

  it('keeps issues separate when messages differ', () => {
    const groupedIssues = groupJobPodIssues([
      makeIssue({
        podName: 'job-worker-0',
        containerName: 'main',
        reason: 'ImagePullBackOff',
        message: 'failed to pull image',
      }),
      makeIssue({
        podName: 'job-worker-1',
        containerName: 'main',
        reason: 'ImagePullBackOff',
        message: 'pull access denied',
      }),
    ]);

    expect(groupedIssues).toHaveLength(2);
  });

  it('keeps issues separate when reasons differ', () => {
    const groupedIssues = groupJobPodIssues([
      makeIssue({
        podName: 'job-worker-0',
        containerName: 'main',
        reason: 'ErrImagePull',
        message: 'failed to pull image',
      }),
      makeIssue({
        podName: 'job-worker-1',
        containerName: 'main',
        reason: 'ImagePullBackOff',
        message: 'failed to pull image',
      }),
    ]);

    expect(groupedIssues).toHaveLength(2);
  });

  it('deduplicates pod names and container names within a group', () => {
    const repeatedIssue = makeIssue({
      podName: 'job-worker-0',
      containerName: 'main',
      reason: 'CreateContainerConfigError',
      message: 'secret not found',
    });

    const groupedIssues = groupJobPodIssues([repeatedIssue, repeatedIssue]);

    expect(groupedIssues).toHaveLength(1);
    expect(groupedIssues[0].pods.map(pod => pod.podName)).toEqual(['job-worker-0']);
    expect(groupedIssues[0].containerNames).toEqual(['main']);
  });

  it('ignores missing container names when building grouped container lists', () => {
    const groupedIssues = groupJobPodIssues([
      makeIssue({
        podName: 'job-worker-0',
        reason: 'Unschedulable',
        message: '0/1 nodes are available',
      }),
      makeIssue({
        podName: 'job-worker-1',
        reason: 'Unschedulable',
        message: '0/1 nodes are available',
      }),
    ]);

    expect(groupedIssues).toHaveLength(1);
    expect(groupedIssues[0].containerNames).toEqual([]);
    expect(groupedIssues[0].pods.map(pod => pod.podName)).toEqual(['job-worker-0', 'job-worker-1']);
  });
});
