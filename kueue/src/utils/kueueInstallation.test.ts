import { beforeEach, describe, expect, it, vi } from 'vitest';

const { clusterFetch } = vi.hoisted(() => ({ clusterFetch: vi.fn() }));

vi.mock('@kinvolk/headlamp-plugin/lib/k8s/api/v2/fetch', () => ({ clusterFetch }));

import { isKueueInstalled } from './kueueInstallation';

describe('isKueueInstalled', () => {
  beforeEach(() => {
    clusterFetch.mockReset();
  });

  it('checks API group discovery for the selected cluster', async () => {
    clusterFetch.mockResolvedValue({ ok: true });

    await expect(isKueueInstalled('dev')).resolves.toBe(true);
    expect(clusterFetch).toHaveBeenCalledWith('/apis/kueue.x-k8s.io', { cluster: 'dev' });
  });

  it('reports Kueue absent only when API discovery returns 404', async () => {
    clusterFetch.mockRejectedValue({ status: 404 });

    await expect(isKueueInstalled('dev')).resolves.toBe(false);
  });

  it('keeps the page available for non-404 discovery errors', async () => {
    clusterFetch.mockRejectedValue({ status: 403 });

    await expect(isKueueInstalled('dev')).resolves.toBe(true);
  });

  it('does not mistake a transport error for an absent installation', async () => {
    clusterFetch.mockRejectedValue(new Error('network unavailable'));

    await expect(isKueueInstalled('dev')).resolves.toBe(true);
  });
});
