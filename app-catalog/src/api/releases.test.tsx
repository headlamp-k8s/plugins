import { beforeEach, describe, expect, it, vi } from 'vitest';
import { listReleases } from './releases';

const { mockRequest, mockGetHeaders } = vi.hoisted(() => ({
  mockRequest: vi.fn(),
  mockGetHeaders: vi.fn(() => ({ 'X-HEADLAMP_BACKEND-TOKEN': 'test-token' })),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: {
    request: mockRequest,
  },
  getHeadlampAPIHeaders: mockGetHeaders,
}));

describe('listReleases', () => {
  beforeEach(() => {
    mockRequest.mockReset();
    mockRequest.mockResolvedValue({ releases: [] });
  });

  it('requests /helm/releases/list when no namespace is provided', async () => {
    await listReleases();

    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockRequest).toHaveBeenCalledWith('/helm/releases/list', {
      method: 'GET',
      headers: { 'X-HEADLAMP_BACKEND-TOKEN': 'test-token' },
    });
  });

  it('scopes the request to the provided namespace', async () => {
    await listReleases('team-a');

    expect(mockRequest).toHaveBeenCalledTimes(1);
    expect(mockRequest).toHaveBeenCalledWith('/helm/releases/list?namespace=team-a', {
      method: 'GET',
      headers: { 'X-HEADLAMP_BACKEND-TOKEN': 'test-token' },
    });
  });

  it('URL-encodes the namespace query parameter', async () => {
    await listReleases('my ns/1');

    expect(mockRequest).toHaveBeenCalledWith('/helm/releases/list?namespace=my%20ns%2F1', {
      method: 'GET',
      headers: { 'X-HEADLAMP_BACKEND-TOKEN': 'test-token' },
    });
  });
});
