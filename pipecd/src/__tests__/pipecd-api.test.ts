import { Code, ConnectError } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockClient = {
  listApplications: vi.fn(),
  getApplication: vi.fn(),
  listDeployments: vi.fn(),
  getDeployment: vi.fn(),
};

vi.mock('@connectrpc/connect-web', () => ({
  createGrpcWebTransport: vi.fn(() => ({})),
}));

vi.mock('@connectrpc/connect', async importOriginal => {
  const actual = await importOriginal<typeof import('@connectrpc/connect')>();
  return {
    ...actual,
    createClient: vi.fn(() => mockClient),
  };
});

import {
  getApplication,
  isConfigured,
  listApplications,
  listDeployments,
  loadConfig,
  PipeCDApiError,
  saveConfig,
} from '../api/pipecd';

const MOCK_CONFIG = {
  baseURL: 'https://pipecd.example.com',
  apiKey: 'test-api-key-abc123',
};

const genApp = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'app-k8s-001',
  name: 'frontend-prod',
  pipedId: 'piped-1',
  projectId: 'project-1',
  kind: 0, // KUBERNETES
  gitPath: undefined,
  cloudProvider: '',
  description: '',
  labels: {},
  syncState: { status: 1, shortReason: '', reason: '', timestamp: BigInt(0) }, // SYNCED
  mostRecentlySuccessfulDeployment: undefined,
  disabled: false,
  createdAt: BigInt(0),
  updatedAt: BigInt(0),
  ...overrides,
});

describe('loadConfig / saveConfig', () => {
  beforeEach(() => localStorage.clear());

  it('returns empty strings when nothing is stored', () => {
    const cfg = loadConfig();
    expect(cfg.baseURL).toBe('');
    expect(cfg.apiKey).toBe('');
  });

  it('round-trips config through localStorage', () => {
    saveConfig({ baseURL: 'https://pipecd.test', apiKey: 'key-xyz' });
    const cfg = loadConfig();
    expect(cfg.baseURL).toBe('https://pipecd.test');
    expect(cfg.apiKey).toBe('key-xyz');
  });

  it('isConfigured returns false for empty config', () => {
    expect(isConfigured({ baseURL: '', apiKey: '' })).toBe(false);
    expect(isConfigured({ baseURL: 'https://x.com', apiKey: '' })).toBe(false);
    expect(isConfigured({ baseURL: '', apiKey: 'key' })).toBe(false);
  });

  it('isConfigured returns true when both fields are set', () => {
    expect(isConfigured(MOCK_CONFIG)).toBe(true);
  });
});

describe('listApplications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches applications and returns parsed data', async () => {
    mockClient.listApplications.mockResolvedValue({ applications: [genApp()], cursor: '' });
    const result = await listApplications(MOCK_CONFIG);
    expect(result.applications).toHaveLength(1);
    expect(result.applications[0].name).toBe('frontend-prod');
    expect(result.applications[0].syncState?.status).toBe('SYNCED');
  });

  it('maps the real apiservice.ListApplications RPC field names, not REST query params', async () => {
    mockClient.listApplications.mockResolvedValue({ applications: [], cursor: '' });
    await listApplications(MOCK_CONFIG, { kind: 'KUBERNETES' });
    expect(mockClient.listApplications).toHaveBeenCalledWith(
      expect.objectContaining({ kind: 'KUBERNETES' })
    );
  });

  it('passes pageSize through as the RPC "limit" field', async () => {
    mockClient.listApplications.mockResolvedValue({ applications: [], cursor: '' });
    await listApplications(MOCK_CONFIG, { pageSize: 10 });
    expect(mockClient.listApplications).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10 })
    );
  });

  it('sends the API-KEY authorization scheme, not Bearer', async () => {
    mockClient.listApplications.mockResolvedValue({ applications: [], cursor: '' });
    await listApplications(MOCK_CONFIG);

    const call = vi.mocked(createGrpcWebTransport).mock.calls[0][0];
    const interceptor = call.interceptors?.[0];
    expect(interceptor).toBeDefined();

    const headers = new Headers();
    const next = (async (req: unknown) => req) as never;
    await (interceptor as (n: never) => (req: { header: Headers }) => Promise<unknown>)(next)({
      header: headers,
    });
    expect(headers.get('authorization')).toBe(`API-KEY ${MOCK_CONFIG.apiKey}`);
  });

  it('throws PipeCDApiError wrapping the gRPC status code on Unauthenticated', async () => {
    mockClient.listApplications.mockRejectedValue(
      new ConnectError('unauthenticated', Code.Unauthenticated)
    );
    await expect(listApplications(MOCK_CONFIG)).rejects.toThrow(PipeCDApiError);
    try {
      await listApplications(MOCK_CONFIG);
    } catch (err) {
      expect(err).toBeInstanceOf(PipeCDApiError);
      expect((err as PipeCDApiError).status).toBe(Code.Unauthenticated);
    }
  });

  it('throws PipeCDApiError on an Internal error', async () => {
    mockClient.listApplications.mockRejectedValue(new ConnectError('boom', Code.Internal));
    await expect(listApplications(MOCK_CONFIG)).rejects.toBeInstanceOf(PipeCDApiError);
  });

  it('propagates non-ConnectError failures directly', async () => {
    mockClient.listApplications.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(listApplications(MOCK_CONFIG)).rejects.toThrow('Failed to fetch');
  });

  it('returns empty applications array when API returns empty list', async () => {
    mockClient.listApplications.mockResolvedValue({ applications: [], cursor: '' });
    const result = await listApplications(MOCK_CONFIG);
    expect(result.applications).toHaveLength(0);
  });
});

describe('getApplication', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches a single application by ID', async () => {
    mockClient.getApplication.mockResolvedValue({ application: genApp() });
    const app = await getApplication(MOCK_CONFIG, 'app-k8s-001');
    expect(app.id).toBe('app-k8s-001');
    expect(app.name).toBe('frontend-prod');
    expect(app.kind).toBe('KUBERNETES');
  });

  it('passes the application ID straight through as an RPC field, not a URL path segment', async () => {
    mockClient.getApplication.mockResolvedValue({ application: genApp() });
    await getApplication(MOCK_CONFIG, 'app/with/slashes');
    expect(mockClient.getApplication).toHaveBeenCalledWith({ applicationId: 'app/with/slashes' });
  });

  it('throws PipeCDApiError when the server returns no application (not-found)', async () => {
    mockClient.getApplication.mockResolvedValue({ application: undefined });
    await expect(getApplication(MOCK_CONFIG, 'nonexistent')).rejects.toBeInstanceOf(PipeCDApiError);
  });
});

describe('listDeployments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('fetches deployments and returns parsed data', async () => {
    mockClient.listDeployments.mockResolvedValue({
      deployments: [
        {
          id: 'dep-1',
          applicationId: 'app-k8s-001',
          applicationName: 'frontend-prod',
          pipedId: 'piped-1',
          projectId: 'project-1',
          kind: 0,
          gitPath: undefined,
          cloudProvider: '',
          trigger: undefined,
          summary: '',
          labels: {},
          status: 4, // DEPLOYMENT_SUCCESS
          statusReason: '',
          stages: [
            {
              id: 's1',
              name: 'WAIT',
              desc: '',
              index: 0,
              predefined: false,
              requires: [],
              visible: true,
              status: 2,
              statusReason: '',
              metadata: {},
              createdAt: BigInt(0),
              completedAt: BigInt(0),
            },
          ],
          completedAt: BigInt(0),
          createdAt: BigInt(0),
          updatedAt: BigInt(0),
        },
      ],
      cursor: '',
    });
    const result = await listDeployments(MOCK_CONFIG);
    expect(result.deployments).toHaveLength(1);
    expect(result.deployments[0].status).toBe('DEPLOYMENT_SUCCESS');
    expect(result.deployments[0].stages).toHaveLength(1);
  });

  it('filters by applicationId via the applicationIds RPC field', async () => {
    mockClient.listDeployments.mockResolvedValue({ deployments: [], cursor: '' });
    await listDeployments(MOCK_CONFIG, { applicationId: 'app-k8s-001' });
    expect(mockClient.listDeployments).toHaveBeenCalledWith(
      expect.objectContaining({ applicationIds: ['app-k8s-001'] })
    );
  });
});
