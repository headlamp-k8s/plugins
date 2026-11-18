import {
  describeTopologyFailures,
  settledItems,
  topologyLoadFailures,
  topologyRequestPaths,
} from './topologyRequests';

describe('topologyRequestPaths', () => {
  const paths = topologyRequestPaths('kafka', 'my-cluster', 'v1', 'v1beta2');
  const selector = 'labelSelector=strimzi.io%2Fcluster%3Dmy-cluster';

  it('lists node pools in the Kafka namespace only', () => {
    expect(paths.nodePools).toBe(
      `/apis/kafka.strimzi.io/v1/namespaces/kafka/kafkanodepools?${selector}`
    );
  });

  it('lists pod sets in the Kafka namespace only', () => {
    expect(paths.podSets).toBe(
      `/apis/core.strimzi.io/v1beta2/namespaces/kafka/strimzipodsets?${selector}`
    );
  });

  it('lists pods in the Kafka namespace only', () => {
    expect(paths.pods).toBe(`/api/v1/namespaces/kafka/pods?${selector}`);
  });

  it('never requests a cluster-wide list', () => {
    for (const path of Object.values(paths)) {
      expect(path).toContain('/namespaces/kafka/');
    }
  });

  it('uses the served API versions', () => {
    const v1beta2 = topologyRequestPaths('kafka', 'my-cluster', 'v1beta2', 'v1beta2');
    expect(v1beta2.nodePools).toContain('/apis/kafka.strimzi.io/v1beta2/');
    expect(v1beta2.podSets).toContain('/apis/core.strimzi.io/v1beta2/');
  });
});

const fulfilled = <T>(value: T): PromiseSettledResult<T> => ({ status: 'fulfilled', value });
const rejected = (reason: unknown): PromiseSettledResult<never> => ({ status: 'rejected', reason });

describe('settledItems', () => {
  it('returns the items of a list that loaded', () => {
    expect(settledItems(fulfilled({ items: ['a', 'b'] }))).toEqual(['a', 'b']);
  });

  it('returns an empty list when the request failed', () => {
    expect(settledItems(rejected({ status: 403 }))).toEqual([]);
  });

  it('returns an empty list when the response has no items', () => {
    expect(settledItems(fulfilled({}))).toEqual([]);
    expect(settledItems(fulfilled(undefined))).toEqual([]);
  });
});

describe('topologyLoadFailures', () => {
  it('lists only the requests that failed, with their status', () => {
    expect(
      topologyLoadFailures([
        ['KafkaNodePools', fulfilled({ items: [] })],
        ['StrimziPodSets', rejected({ status: 403 })],
        ['Pods', fulfilled({ items: [] })],
      ])
    ).toEqual([{ resource: 'StrimziPodSets', status: 403 }]);
  });

  it('leaves out the status when the error has none', () => {
    expect(topologyLoadFailures([['Pods', rejected(new Error('network down'))]])).toEqual([
      { resource: 'Pods' },
    ]);
  });

  it('returns nothing when every request loaded', () => {
    expect(topologyLoadFailures([['Pods', fulfilled({ items: [] })]])).toEqual([]);
  });
});

describe('describeTopologyFailures', () => {
  it('is empty when nothing failed', () => {
    expect(describeTopologyFailures([], 'kafka')).toBe('');
  });

  it('names each unreadable list and why', () => {
    expect(
      describeTopologyFailures(
        [
          { resource: 'StrimziPodSets', status: 403 },
          { resource: 'KafkaNodePools', status: 404 },
          { resource: 'Pods', status: 500 },
          { resource: 'Pods' },
        ],
        'kafka'
      )
    ).toBe(
      "Couldn't read StrimziPodSets (no permission), KafkaNodePools (not found), " +
        'Pods (error 500), Pods (request failed) in namespace kafka, so the topology may be incomplete.'
    );
  });
});
