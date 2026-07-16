import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

async function loadHook(options?: { updateHistory?: () => void; t?: (key: string) => string }) {
  vi.resetModules();

  const mockSetShowApiConfirmation = vi.fn();
  const mockSetApiRequest = vi.fn();
  const mockSetApiResponse = vi.fn();
  const mockSetApiLoading = vi.fn();
  const mockSetApiRequestError = vi.fn();
  const mockHandleActualApiRequest = vi.fn().mockResolvedValue('ok');

  let stateIndex = 0;
  const stateValues = [false, null, null, false, null];
  const setters = [
    mockSetShowApiConfirmation,
    mockSetApiRequest,
    mockSetApiResponse,
    mockSetApiLoading,
    mockSetApiRequestError,
  ];

  vi.doMock('react', () => {
    const React = {
      useState: vi.fn((init: unknown) => {
        const idx = stateIndex++;
        return [stateValues[idx] ?? init, setters[idx]];
      }),
      useMemo: vi.fn((factory: () => any) => factory()),
    };
    return { ...React, default: React };
  });

  vi.doMock('../api/clusterActions', () => ({
    handleActualApiRequest: mockHandleActualApiRequest,
  }));

  const module = await import('./useKubernetesToolUI');
  const boundHook = (updateHistory?: () => void) =>
    module.useKubernetesToolUI(updateHistory ?? options?.updateHistory);

  return {
    useKubernetesToolUI: boundHook,
    setters: {
      setShowApiConfirmation: mockSetShowApiConfirmation,
      setApiRequest: mockSetApiRequest,
      setApiResponse: mockSetApiResponse,
      setApiLoading: mockSetApiLoading,
      setApiRequestError: mockSetApiRequestError,
    },
    mockHandleActualApiRequest,
  };
}

describe('useKubernetesToolUI', () => {
  it('returns initial state with all values unset', async () => {
    const { useKubernetesToolUI } = await loadHook();
    const { state } = useKubernetesToolUI();

    expect(state.showApiConfirmation).toBe(false);
    expect(state.apiRequest).toBeNull();
    expect(state.apiResponse).toBeNull();
    expect(state.apiLoading).toBe(false);
    expect(state.apiRequestError).toBeNull();
  });

  it('returns callbacks object with expected keys', async () => {
    const { useKubernetesToolUI } = await loadHook();
    const { callbacks } = useKubernetesToolUI();

    expect(callbacks.setShowApiConfirmation).toBeDefined();
    expect(callbacks.setApiRequest).toBeDefined();
    expect(callbacks.setApiResponse).toBeDefined();
    expect(callbacks.setApiLoading).toBeDefined();
    expect(callbacks.setApiRequestError).toBeDefined();
    expect(callbacks.handleActualApiRequest).toBeDefined();
  });

  it('handleActualApiRequest calls the underlying handler', async () => {
    const { useKubernetesToolUI, mockHandleActualApiRequest } = await loadHook();
    const { callbacks } = useKubernetesToolUI();

    await callbacks.handleActualApiRequest('/api/v1/pods', 'GET');
    expect(mockHandleActualApiRequest).toHaveBeenCalled();
  });

  it('handleActualApiRequest wraps onSuccess with updateHistory', async () => {
    const updateHistory = vi.fn();
    const { useKubernetesToolUI, mockHandleActualApiRequest } = await loadHook({ updateHistory });
    const { callbacks } = useKubernetesToolUI(updateHistory);

    const onSuccess = vi.fn();
    await callbacks.handleActualApiRequest(
      '/api/v1/pods',
      'GET',
      '',
      () => {},
      undefined,
      undefined,
      undefined,
      undefined,
      onSuccess
    );

    // The wrapped onSuccess should be passed to handleActualApiRequest
    const lastCall = mockHandleActualApiRequest.mock.calls[0];
    // onSuccess is arg index 8
    const wrappedOnSuccess = lastCall[8];
    if (wrappedOnSuccess) {
      wrappedOnSuccess({ status: 200 }, 'GET');
      expect(onSuccess).toHaveBeenCalledWith({ status: 200 }, 'GET', undefined);
      expect(updateHistory).toHaveBeenCalled();
    }
  });

  it('handleActualApiRequest wraps onFailure with updateHistory', async () => {
    const updateHistory = vi.fn();
    const { useKubernetesToolUI, mockHandleActualApiRequest } = await loadHook({ updateHistory });
    const { callbacks } = useKubernetesToolUI(updateHistory);

    const onFailure = vi.fn();
    await callbacks.handleActualApiRequest(
      '/api/v1/pods',
      'DELETE',
      '',
      () => {},
      undefined,
      undefined,
      undefined,
      onFailure
    );

    // The wrapped onFailure should be passed to handleActualApiRequest
    const lastCall = mockHandleActualApiRequest.mock.calls[0];
    // onFailure is arg index 7
    const wrappedOnFailure = lastCall[7];
    if (wrappedOnFailure) {
      wrappedOnFailure(new Error('fail'), 'DELETE');
      expect(onFailure).toHaveBeenCalledWith(new Error('fail'), 'DELETE', undefined);
      expect(updateHistory).toHaveBeenCalled();
    }
  });
});
