import { beforeEach, describe, expect, it, vi } from 'vitest';

const { clusterRequest, request } = vi.hoisted(() => ({
  clusterRequest: vi.fn(),
  request: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({ clusterRequest, request }));

import { isKueueInstalled } from './kueueInstallation';

describe('isKueueInstalled', () => {
  beforeEach(() => {
    clusterRequest.mockReset();
    request.mockReset();
  });

  it('checks API group discovery for the selected cluster', async () => {
    clusterRequest.mockResolvedValue({});

    await expect(isKueueInstalled('dev')).resolves.toBe(true);
    expect(clusterRequest).toHaveBeenCalledWith('/apis/kueue.x-k8s.io', { cluster: 'dev' });
  });

  it('asks the current cluster when none is given', async () => {
    request.mockResolvedValue({});

    await expect(isKueueInstalled()).resolves.toBe(true);
    expect(request).toHaveBeenCalledWith('/apis/kueue.x-k8s.io');
    expect(clusterRequest).not.toHaveBeenCalled();
  });

  it('reports Kueue absent only when API discovery returns 404', async () => {
    clusterRequest.mockRejectedValue({ status: 404 });

    await expect(isKueueInstalled('dev')).resolves.toBe(false);
  });

  it('keeps the page available for non-404 discovery errors', async () => {
    clusterRequest.mockRejectedValue({ status: 403 });

    await expect(isKueueInstalled('dev')).resolves.toBe(true);
  });

  it('does not mistake a transport error for an absent installation', async () => {
    clusterRequest.mockRejectedValue(new Error('network unavailable'));

    await expect(isKueueInstalled('dev')).resolves.toBe(true);
  });
});
