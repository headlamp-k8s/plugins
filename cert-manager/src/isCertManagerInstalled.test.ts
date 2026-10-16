import { beforeEach, describe, expect, it, vi } from 'vitest';

const { request } = vi.hoisted(() => ({ request: vi.fn() }));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { request },
}));

import { probeCertManagerInstalled } from './isCertManagerInstalled';

/** Builds the ApiError shape Headlamp rejects with: an Error carrying `status`. */
function apiError(status?: number): Error {
  return Object.assign(new Error(`request failed: ${status}`), { status });
}

describe('probeCertManagerInstalled', () => {
  beforeEach(() => {
    request.mockReset();
  });

  it('reports installed when discovery succeeds', async () => {
    request.mockResolvedValue({ kind: 'APIResourceList', resources: [] });

    await expect(probeCertManagerInstalled()).resolves.toBe('installed');
    expect(request).toHaveBeenCalledWith('/apis/cert-manager.io/v1', { method: 'GET' });
  });

  it('reports absent only when discovery returns 404', async () => {
    request.mockRejectedValue(apiError(404));

    await expect(probeCertManagerInstalled()).resolves.toBe('absent');
  });

  it('reports unreachable when the request is denied', async () => {
    request.mockRejectedValue(apiError(403));

    await expect(probeCertManagerInstalled()).resolves.toBe('unreachable');
  });

  it('reports unreachable for the 502 Headlamp synthesises when fetch throws', async () => {
    request.mockRejectedValue(apiError(502));

    await expect(probeCertManagerInstalled()).resolves.toBe('unreachable');
  });

  it('reports unreachable for the 408 Headlamp synthesises on timeout', async () => {
    request.mockRejectedValue(apiError(408));

    await expect(probeCertManagerInstalled()).resolves.toBe('unreachable');
  });

  it('reports unreachable when the rejection carries no status', async () => {
    request.mockRejectedValue(new Error('network down'));

    await expect(probeCertManagerInstalled()).resolves.toBe('unreachable');
  });
});
