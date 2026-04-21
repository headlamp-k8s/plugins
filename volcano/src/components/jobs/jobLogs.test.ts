import { getLogsHelperMessage, sortLogsByTimestamp } from './jobLogs';

describe('getLogsHelperMessage', () => {
  it('returns no pods message once the no-pods guard is enabled', () => {
    expect(
      getLogsHelperMessage({
        logs: [],
        podError: null,
        pods: [],
        podsLoading: false,
        isInitializingSelection: false,
        shouldShowNoLogsMessage: false,
        shouldShowNoPodsMessage: true,
        selectedContainer: '',
        selectedPods: [],
      })
    ).toBe(
      'No pods have been created for this Job yet. It may still be pending or unschedulable. Check Pod Issues and Events.'
    );
  });

  it('returns no logs message once a valid selection is settled', () => {
    expect(
      getLogsHelperMessage({
        logs: [],
        podError: null,
        pods: [{ metadata: { name: 'job-0' } }],
        podsLoading: false,
        isInitializingSelection: false,
        shouldShowNoLogsMessage: true,
        shouldShowNoPodsMessage: false,
        selectedContainer: 'main',
        selectedPods: [{ metadata: { name: 'job-0' } }],
      })
    ).toBe(
      'No logs available yet. The selected container may not have started or may not have emitted output. Check Pod Issues and Events.'
    );
  });

  it('returns loading message while selection is still initializing', () => {
    expect(
      getLogsHelperMessage({
        logs: [],
        podError: null,
        pods: [{ metadata: { name: 'job-0' } }],
        podsLoading: false,
        isInitializingSelection: true,
        shouldShowNoLogsMessage: true,
        shouldShowNoPodsMessage: false,
        selectedContainer: '',
        selectedPods: [{ metadata: { name: 'job-0' } }],
      })
    ).toBe('Loading logs...');
  });
});

describe('sortLogsByTimestamp', () => {
  it('sorts by full RFC3339 timestamp and falls back deterministically', () => {
    const logs = [
      '[pod-b/main] 2026-04-18T13:16:58.715082657Z hello from template',
      '[pod-a/main] 2026-04-18T13:16:58.115082657Z starting up',
      '[pod-c/main] no timestamp here',
      '[pod-a/main] 2026-04-18T13:16:58.115082657Z another line',
    ];

    expect(sortLogsByTimestamp(logs)).toEqual([
      '[pod-a/main] 2026-04-18T13:16:58.115082657Z another line',
      '[pod-a/main] 2026-04-18T13:16:58.115082657Z starting up',
      '[pod-b/main] 2026-04-18T13:16:58.715082657Z hello from template',
      '[pod-c/main] no timestamp here',
    ]);
  });
});
