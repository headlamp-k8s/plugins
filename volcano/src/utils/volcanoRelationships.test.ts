import { VolcanoJob } from '../resources/job';
import { VolcanoPodGroup } from '../resources/podgroup';
import { getRelatedPodGroup } from './volcanoRelationships';

function makeJob(name: string, namespace: string, uid = 'job-uid'): VolcanoJob {
  return { metadata: { name, namespace, uid } } as VolcanoJob;
}

function makePodGroup(name: string, namespace: string): VolcanoPodGroup {
  return { metadata: { name, namespace } } as VolcanoPodGroup;
}

describe('getRelatedPodGroup', () => {
  it('does not match a same-named PodGroup from a different namespace', () => {
    const job = makeJob('training-job', 'team-a');
    const podGroups = [makePodGroup('training-job', 'team-b')];

    expect(getRelatedPodGroup(job, podGroups)).toBeNull();
  });

  it('matches the PodGroup in the same namespace when names collide across namespaces', () => {
    const job = makeJob('training-job', 'team-a');
    const ownJobPodGroup = makePodGroup('training-job', 'team-a');
    const podGroups = [makePodGroup('training-job', 'team-b'), ownJobPodGroup];

    expect(getRelatedPodGroup(job, podGroups)).toBe(ownJobPodGroup);
  });

  it('matches by canonical name within the same namespace', () => {
    const job = makeJob('training-job', 'team-a', 'abc-123');
    const podGroup = makePodGroup('training-job-abc-123', 'team-a');

    expect(getRelatedPodGroup(job, [podGroup])).toBe(podGroup);
  });

  it('returns null when there are no podGroups', () => {
    expect(getRelatedPodGroup(makeJob('j', 'ns'), [])).toBeNull();
    expect(getRelatedPodGroup(makeJob('j', 'ns'), null)).toBeNull();
  });
});
