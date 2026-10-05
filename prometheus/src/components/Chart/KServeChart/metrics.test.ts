import { formatLatencySeconds } from './KServeLatencyChart';
import { getKServePodSelector, getKServeQueries } from './metrics';

describe('KServe InferenceService queries', () => {
  test('builds predictor queries by default', () => {
    const queries = getKServeQueries('kserve-test', 'sklearn-iris');
    const selector = "namespace='kserve-test',pod=~'sklearn-iris-predictor-.*'";

    expect(queries).toEqual({
      requestRate: `sum(rate(request_predict_seconds_count{${selector}}[2m]))`,
      latencyP50: `histogram_quantile(0.5, sum(rate(request_predict_seconds_bucket{${selector}}[2m])) by (le))`,
      latencyP95: `histogram_quantile(0.95, sum(rate(request_predict_seconds_bucket{${selector}}[2m])) by (le))`,
      latencyP99: `histogram_quantile(0.99, sum(rate(request_predict_seconds_bucket{${selector}}[2m])) by (le))`,
      cpu: `sum(rate(container_cpu_usage_seconds_total{${selector},container!=''}[2m]))`,
      memory: `sum(container_memory_working_set_bytes{${selector},container!=''})`,
    });
  });

  test('selects transformer pods when requested', () => {
    const queries = getKServeQueries('kserve-test', 'sklearn-iris', 'transformer');

    for (const query of Object.values(queries)) {
      expect(query).toContain("pod=~'sklearn-iris-transformer-.*'");
      expect(query).not.toContain('predictor');
    }
  });

  test('selects explainer pods when requested', () => {
    expect(getKServePodSelector('ns', 'isvc', 'explainer')).toBe(
      "namespace='ns',pod=~'isvc-explainer-.*'"
    );
  });

  test('pod pattern matches raw and Knative deployment pod names only', () => {
    const pattern = new RegExp('^sklearn-iris-predictor-.*$');

    expect(pattern.test('sklearn-iris-predictor-7d9f8b6c4-x2k8p')).toBe(true);
    expect(pattern.test('sklearn-iris-predictor-00001-deployment-5c8d7f9b8-abcde')).toBe(true);
    expect(pattern.test('sklearn-iris-transformer-7d9f8b6c4-x2k8p')).toBe(false);
    expect(pattern.test('other-sklearn-iris-predictor-7d9f8b6c4-x2k8p')).toBe(false);
  });

  test('escapes quotes and backslashes in the namespace', () => {
    expect(getKServePodSelector("team'one", 'isvc')).toBe(
      "namespace='team\\'one',pod=~'isvc-predictor-.*'"
    );
    expect(getKServePodSelector('a\\b', 'isvc')).toContain("namespace='a\\\\b'");
  });

  test('matches the service name literally in the pod pattern', () => {
    // Regex metacharacters are escaped for the regex, then the backslash is escaped for PromQL.
    expect(getKServePodSelector('ns', 'my.model')).toBe(
      "namespace='ns',pod=~'my\\\\.model-predictor-.*'"
    );
    expect(getKServePodSelector('ns', "it's")).toContain("pod=~'it\\'s-predictor-.*'");
  });
});

describe('formatLatencySeconds', () => {
  test.each([
    [0, '0ms'],
    [0.0123, '12ms'],
    [0.999, '999ms'],
    [1, '1.00s'],
    [2.5, '2.50s'],
  ])('formats %s seconds as %s', (value, expected) => {
    expect(formatLatencySeconds(value)).toBe(expected);
  });

  test('passes through non-numeric values', () => {
    expect(formatLatencySeconds('n/a')).toBe('n/a');
  });
});
