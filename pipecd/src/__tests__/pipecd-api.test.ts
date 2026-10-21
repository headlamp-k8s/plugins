/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Code, ConnectError } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mockClient = {
  listApplications: vi.fn(),
  getApplication: vi.fn(),
  listDeployments: vi.fn(),
  getDeployment: vi.fn(),
  listStageLogs: vi.fn(),
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
  listStageLogs,
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

const genDeployment = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'dep-1',
  applicationId: 'app-k8s-001',
  applicationName: 'frontend-prod',
  pipedId: 'piped-1',
  projectId: 'project-1',
  kind: 0, // KUBERNETES, and also the zero value a v1 piped leaves behind
  gitPath: undefined,
  cloudProvider: '',
  trigger: undefined,
  summary: '',
  labels: {},
  status: 4, // DEPLOYMENT_SUCCESS
  statusReason: '',
  stages: [],
  completedAt: BigInt(0),
  createdAt: BigInt(0),
  updatedAt: BigInt(0),
  ...overrides,
});

describe('loadConfig / saveConfig', () => {
  beforeEach(() => {
    saveConfig({ baseURL: '', apiKey: '' });
    localStorage.clear();
    sessionStorage.clear();
  });

  it('returns empty strings when nothing is stored', () => {
    const cfg = loadConfig();
    expect(cfg.baseURL).toBe('');
    expect(cfg.apiKey).toBe('');
  });

  it('round-trips config in memory without persisting the API key', () => {
    saveConfig({ baseURL: 'https://pipecd.test', apiKey: 'key-xyz' });
    const cfg = loadConfig();
    expect(cfg.baseURL).toBe('https://pipecd.test');
    expect(cfg.apiKey).toBe('key-xyz');
    expect(localStorage.getItem('pipecd-plugin-base-url')).toBe('https://pipecd.test');
    expect(localStorage.getItem('pipecd-plugin-api-key')).toBeNull();
    expect(localStorage.length).toBe(1);
    expect(sessionStorage.length).toBe(0);
  });

  it('discards legacy credentials as soon as the plugin API module loads', async () => {
    localStorage.setItem('pipecd-plugin-base-url', 'https://pipecd.test');
    localStorage.setItem('pipecd-plugin-api-key', 'legacy-key');

    vi.resetModules();
    const freshApi = await vi.importActual<typeof import('../api/pipecd')>('../api/pipecd');

    expect(localStorage.getItem('pipecd-plugin-api-key')).toBeNull();
    expect(freshApi.loadConfig()).toEqual({ baseURL: 'https://pipecd.test', apiKey: '' });
  });

  it('retains only the server URL after a module reload', async () => {
    saveConfig({ baseURL: 'https://pipecd.test', apiKey: 'key-xyz' });

    vi.resetModules();
    const freshApi = await vi.importActual<typeof import('../api/pipecd')>('../api/pipecd');

    expect(freshApi.loadConfig()).toEqual({ baseURL: 'https://pipecd.test', apiKey: '' });
    expect(isConfigured(freshApi.loadConfig())).toBe(false);
  });

  it('does not pair a saved API key with a URL changed by another tab', () => {
    saveConfig({ baseURL: 'https://pipecd.test', apiKey: 'key-xyz' });
    localStorage.setItem('pipecd-plugin-base-url', 'https://other.example.com');

    expect(loadConfig()).toEqual({ baseURL: 'https://pipecd.test', apiKey: 'key-xyz' });
  });

  it('clears the in-memory key without removing the server URL', () => {
    saveConfig({ baseURL: 'https://pipecd.test', apiKey: 'key-xyz' });
    saveConfig({ baseURL: 'https://pipecd.test', apiKey: '' });

    expect(loadConfig()).toEqual({ baseURL: 'https://pipecd.test', apiKey: '' });
    expect(isConfigured(loadConfig())).toBe(false);
  });

  it('does not expose mutable references to the in-memory configuration', () => {
    const config = { baseURL: 'https://pipecd.test', apiKey: 'key-xyz' };
    saveConfig(config);
    config.baseURL = 'https://other.example.com';
    loadConfig().apiKey = 'other-key';

    expect(loadConfig()).toEqual({ baseURL: 'https://pipecd.test', apiKey: 'key-xyz' });
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

  it('shows a deploying app as DEPLOYING even if its last sync state was SYNCED', async () => {
    mockClient.listApplications.mockResolvedValue({
      applications: [genApp({ deploying: true })],
      cursor: '',
    });
    const result = await listApplications(MOCK_CONFIG);
    expect(result.applications[0].syncState?.status).toBe('DEPLOYING');
  });

  it('shows a deploying app as DEPLOYING when it has no sync state yet', async () => {
    mockClient.listApplications.mockResolvedValue({
      applications: [genApp({ deploying: true, syncState: undefined })],
      cursor: '',
    });
    const result = await listApplications(MOCK_CONFIG);
    expect(result.applications[0].syncState?.status).toBe('DEPLOYING');
  });

  // The server filters `kind` on the deprecated field, which a v1 piped leaves
  // at 0 (KUBERNETES), so the filter has to run on the resolved platform.
  const v1Terraform = genApp({
    id: 'app-tf-001',
    name: 'infra',
    kind: 0,
    deployTargetsByPlugin: { terraform: {} },
  });

  it('does not send the platform filter to the server', async () => {
    mockClient.listApplications.mockResolvedValue({ applications: [], cursor: '' });
    await listApplications(MOCK_CONFIG, { kind: 'TERRAFORM' });
    expect(mockClient.listApplications).toHaveBeenCalledWith(
      expect.objectContaining({ kind: '' }),
      expect.anything()
    );
  });

  it('includes a v1 Terraform app in the Terraform filter', async () => {
    mockClient.listApplications.mockResolvedValue({
      applications: [genApp(), v1Terraform],
      cursor: '',
    });
    const result = await listApplications(MOCK_CONFIG, { kind: 'TERRAFORM' });
    expect(result.applications.map(a => a.id)).toEqual(['app-tf-001']);
  });

  it('leaves a v1 Terraform app out of the Kubernetes filter', async () => {
    mockClient.listApplications.mockResolvedValue({
      applications: [genApp(), v1Terraform],
      cursor: '',
    });
    const result = await listApplications(MOCK_CONFIG, { kind: 'KUBERNETES' });
    expect(result.applications.map(a => a.id)).toEqual(['app-k8s-001']);
  });

  it('follows the cursor so matches on later pages are not skipped', async () => {
    mockClient.listApplications
      .mockResolvedValueOnce({ applications: [genApp()], cursor: 'page-2' })
      .mockResolvedValueOnce({ applications: [v1Terraform], cursor: '' });
    const result = await listApplications(MOCK_CONFIG, { kind: 'TERRAFORM' });
    expect(result.applications.map(a => a.id)).toEqual(['app-tf-001']);
    expect(mockClient.listApplications).toHaveBeenCalledTimes(2);
    expect(mockClient.listApplications).toHaveBeenLastCalledWith(
      expect.objectContaining({ cursor: 'page-2' }),
      expect.anything()
    );
  });

  it('passes pageSize through as the RPC "limit" field', async () => {
    mockClient.listApplications.mockResolvedValue({ applications: [], cursor: '' });
    await listApplications(MOCK_CONFIG, { pageSize: 10 });
    expect(mockClient.listApplications).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 10 }),
      expect.anything()
    );
  });

  it('reports a cancelled request as an AbortError, not an API failure', async () => {
    mockClient.listApplications.mockRejectedValue(new ConnectError('cancelled', Code.Canceled));

    await expect(listApplications(MOCK_CONFIG)).rejects.toMatchObject({ name: 'AbortError' });
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
      expect.objectContaining({ applicationIds: ['app-k8s-001'] }),
      expect.anything()
    );
  });

  it('forwards the abort signal to the RPC so callers can cancel', async () => {
    mockClient.listDeployments.mockResolvedValue({ deployments: [], cursor: '' });
    const controller = new AbortController();

    await listDeployments(MOCK_CONFIG, { signal: controller.signal });

    expect(mockClient.listDeployments).toHaveBeenCalledWith(expect.anything(), {
      signal: controller.signal,
    });
  });
});

// `kind` is deprecated on both Application and Deployment. A plugin-arch (v1)
// piped leaves it at the protobuf zero value, which happens to mean KUBERNETES,
// so the deploy targets have to be consulted first or every Terraform, Lambda,
// Cloud Run and ECS resource reports as Kubernetes.
describe('platform resolution', () => {
  beforeEach(() => vi.clearAllMocks());

  it('reads a v1 deployment kind from its deploy targets, not the deprecated field', async () => {
    mockClient.listDeployments.mockResolvedValue({
      deployments: [
        genDeployment({ deployTargetsByPlugin: { terraform: { deployTargets: ['tf'] } } }),
      ],
      cursor: '',
    });

    const result = await listDeployments(MOCK_CONFIG);

    expect(result.deployments[0].kind).toBe('TERRAFORM');
  });

  it.each([
    ['lambda', 'LAMBDA'],
    ['cloudrun', 'CLOUD_RUN'],
    ['ecs', 'ECS'],
    ['kubernetes_multicluster', 'KUBERNETES'],
  ])('maps the %s plugin to %s', async (plugin, expected) => {
    mockClient.listDeployments.mockResolvedValue({
      deployments: [genDeployment({ deployTargetsByPlugin: { [plugin]: { deployTargets: [] } } })],
      cursor: '',
    });

    const result = await listDeployments(MOCK_CONFIG);

    expect(result.deployments[0].kind).toBe(expected);
  });

  it('falls back to the deprecated field for a v0 deployment with no deploy targets', async () => {
    mockClient.listDeployments.mockResolvedValue({
      deployments: [genDeployment({ kind: 1, deployTargetsByPlugin: {} })], // 1 = TERRAFORM
      cursor: '',
    });

    const result = await listDeployments(MOCK_CONFIG);

    expect(result.deployments[0].kind).toBe('TERRAFORM');
  });

  it('reads an application kind from its deploy targets too', async () => {
    mockClient.listApplications.mockResolvedValue({
      applications: [genApp({ deployTargetsByPlugin: { ecs: { deployTargets: [] } } })],
      cursor: '',
    });

    const result = await listApplications(MOCK_CONFIG);

    expect(result.applications[0].kind).toBe('ECS');
  });

  it('reports an unrecognised plugin as unknown, not as the zero-value Kubernetes', async () => {
    mockClient.listDeployments.mockResolvedValue({
      deployments: [genDeployment({ deployTargetsByPlugin: { somethingNew: {} } })],
      cursor: '',
    });

    const result = await listDeployments(MOCK_CONFIG);

    expect(result.deployments[0].kind).toBe('UNKNOWN');
  });
});

describe('listStageLogs', () => {
  beforeEach(() => vi.clearAllMocks());

  it('maps each stage log, converting bigints and severity names', async () => {
    mockClient.listStageLogs.mockResolvedValue({
      stageLogs: {
        s1: {
          blocks: [
            { index: BigInt(0), log: 'starting', severity: 0, createdAt: BigInt(1700000000) },
            { index: BigInt(1), log: 'done', severity: 1, createdAt: BigInt(1700000005) },
            { index: BigInt(2), log: 'boom', severity: 2, createdAt: BigInt(1700000009) },
          ],
          completed: true,
        },
      },
    });

    const result = await listStageLogs(MOCK_CONFIG, 'dep-1');

    expect(mockClient.listStageLogs).toHaveBeenCalledWith({ deploymentId: 'dep-1' });
    expect(result.stageLogs.s1.completed).toBe(true);
    expect(result.stageLogs.s1.blocks).toEqual([
      { index: 0, log: 'starting', severity: 'INFO', createdAt: 1700000000 },
      { index: 1, log: 'done', severity: 'SUCCESS', createdAt: 1700000005 },
      { index: 2, log: 'boom', severity: 'ERROR', createdAt: 1700000009 },
    ]);
  });

  it('returns an empty map when no stage has logs yet', async () => {
    mockClient.listStageLogs.mockResolvedValue({ stageLogs: {} });

    const result = await listStageLogs(MOCK_CONFIG, 'dep-1');

    expect(result.stageLogs).toEqual({});
  });
});
