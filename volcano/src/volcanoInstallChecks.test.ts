import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { isVolcanoNamespaceQueueInstalled } from './volcanoInstallChecks';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { request: vi.fn() },
}));

vi.mock('./resources/namespacequeue', () => ({
  VolcanoNamespaceQueue: { apiName: 'namespacequeues' },
}));

const requestMock = vi.mocked(ApiProxy.request);

describe('isVolcanoNamespaceQueueInstalled', () => {
  beforeEach(() => {
    requestMock.mockReset();
  });

  it('returns true when the scheduling API group serves namespacequeues', async () => {
    requestMock.mockResolvedValue({
      resources: [{ name: 'queues' }, { name: 'namespacequeues' }],
    });

    await expect(isVolcanoNamespaceQueueInstalled()).resolves.toBe(true);
    expect(requestMock).toHaveBeenCalledWith('/apis/scheduling.volcano.sh/v1beta1', {
      method: 'GET',
    });
  });

  it('probes the requested cluster', async () => {
    requestMock.mockResolvedValue({ resources: [{ name: 'namespacequeues' }] });

    await expect(isVolcanoNamespaceQueueInstalled('cluster-b')).resolves.toBe(true);
    expect(requestMock).toHaveBeenCalledWith('/apis/scheduling.volcano.sh/v1beta1', {
      method: 'GET',
      cluster: 'cluster-b',
    });
  });

  it('returns false when the group is installed but namespacequeues is not served', async () => {
    requestMock.mockResolvedValue({ resources: [{ name: 'queues' }, { name: 'podgroups' }] });

    await expect(isVolcanoNamespaceQueueInstalled()).resolves.toBe(false);
  });

  it('returns false when the request fails', async () => {
    requestMock.mockRejectedValue(new Error('404 page not found'));

    await expect(isVolcanoNamespaceQueueInstalled()).resolves.toBe(false);
  });
});
