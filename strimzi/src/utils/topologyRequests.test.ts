import { topologyRequestPaths } from './topologyRequests';

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
