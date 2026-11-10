import { hasApiResource } from './volcanoApi';

describe('hasApiResource', () => {
  const resourceList = {
    kind: 'APIResourceList',
    groupVersion: 'scheduling.volcano.sh/v1beta1',
    resources: [
      { name: 'queues', kind: 'Queue' },
      { name: 'podgroups', kind: 'PodGroup' },
      { name: 'podgroups/status', kind: 'PodGroup' },
    ],
  };

  it('finds a resource served by the API group version', () => {
    expect(hasApiResource(resourceList, 'queues')).toBe(true);
  });

  it('does not match a missing resource or a subresource name', () => {
    expect(hasApiResource(resourceList, 'namespacequeues')).toBe(false);
    expect(hasApiResource(resourceList, 'status')).toBe(false);
  });

  it('returns false for an empty or malformed response', () => {
    expect(hasApiResource({ resources: [] }, 'queues')).toBe(false);
    expect(hasApiResource({}, 'queues')).toBe(false);
    expect(hasApiResource(null, 'queues')).toBe(false);
    expect(hasApiResource('not a resource list', 'queues')).toBe(false);
  });
});
