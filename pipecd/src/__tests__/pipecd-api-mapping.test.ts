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
};

vi.mock('@connectrpc/connect-web', () => ({
  createGrpcWebTransport: vi.fn(() => ({})),
}));

vi.mock('@connectrpc/connect', async importOriginal => {
  const actual = await importOriginal<typeof import('@connectrpc/connect')>();
  return { ...actual, createClient: vi.fn(() => mockClient) };
});

import {
  getApplication,
  getDeployment,
  listApplications,
  listDeployments,
  PipeCDApiError,
} from '../api/pipecd';

const MOCK_CONFIG = {
  baseURL: 'https://pipecd.example.com',
  apiKey: 'test-api-key-abc123',
};

const genCommit = {
  hash: 'a1b2c3d4',
  message: 'feat: add dark mode',
  author: 'Alice Dev',
  branch: 'main',
  url: 'https://github.com/myorg/frontend/commit/a1b2c3d4',
  createdAt: BigInt(1721990000),
};

const genApp = (overrides: Record<string, unknown> = {}) => ({
  id: 'app-k8s-001',
  name: 'frontend-prod',
  pipedId: 'piped-1',
  projectId: 'project-1',
  kind: 0,
  gitPath: undefined,
  cloudProvider: '',
  description: '',
  labels: {},
  syncState: { status: 1, shortReason: '', reason: '', timestamp: BigInt(0) },
  mostRecentlySuccessfulDeployment: undefined,
  mostRecentlyTriggeredDeployment: undefined,
  disabled: false,
  createdAt: BigInt(0),
  updatedAt: BigInt(0),
  ...overrides,
});

const genStage = (overrides: Record<string, unknown> = {}) => ({
  id: 'stage-1',
  name: 'K8S_SYNC',
  desc: 'Sync by applying manifests',
  index: 0,
  predefined: true,
  requires: [],
  rollback: false,
  retriedCount: 0,
  visible: false,
  status: 2,
  statusReason: '',
  metadata: {},
  createdAt: BigInt(1722000000),
  completedAt: BigInt(1722000060),
  ...overrides,
});

const genDeployment = (overrides: Record<string, unknown> = {}) => ({
  id: 'dep-1',
  applicationId: 'app-k8s-001',
  applicationName: 'frontend-prod',
  pipedId: 'piped-1',
  projectId: 'project-1',
  kind: 0,
  gitPath: undefined,
  cloudProvider: '',
  trigger: undefined,
  summary: 'Quick sync',
  labels: {},
  status: 4,
  statusReason: '',
  stages: [],
  completedAt: BigInt(0),
  createdAt: BigInt(0),
  updatedAt: BigInt(0),
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

describe('application mapping', () => {
  it('converts bigint timestamps to plain numbers', async () => {
    mockClient.getApplication.mockResolvedValue({
      application: genApp({
        createdAt: BigInt(1700000000),
        updatedAt: BigInt(1722000000),
        syncState: { status: 1, shortReason: '', reason: '', timestamp: BigInt(1722000500) },
      }),
    });

    const app = await getApplication(MOCK_CONFIG, 'app-k8s-001');

    expect(app.createdAt).toBe(1700000000);
    expect(app.updatedAt).toBe(1722000000);
    expect(app.syncState?.timestamp).toBe(1722000500);
  });

  it.each([
    [0, 'UNKNOWN'],
    [1, 'SYNCED'],
    [2, 'DEPLOYING'],
    [3, 'OUT_OF_SYNC'],
    [4, 'INVALID_CONFIG'],
  ])('maps sync status %i to %s', async (status, expected) => {
    mockClient.getApplication.mockResolvedValue({
      application: genApp({
        syncState: { status, shortReason: '', reason: '', timestamp: BigInt(0) },
      }),
    });

    const app = await getApplication(MOCK_CONFIG, 'app-k8s-001');

    expect(app.syncState?.status).toBe(expected);
  });

  it('reports a sync status it does not know as UNKNOWN', async () => {
    mockClient.getApplication.mockResolvedValue({
      application: genApp({
        syncState: { status: 99, shortReason: '', reason: '', timestamp: BigInt(0) },
      }),
    });

    const app = await getApplication(MOCK_CONFIG, 'app-k8s-001');

    expect(app.syncState?.status).toBe('UNKNOWN');
  });

  it('leaves the sync state out when the server sends none', async () => {
    mockClient.getApplication.mockResolvedValue({
      application: genApp({ syncState: undefined }),
    });

    const app = await getApplication(MOCK_CONFIG, 'app-k8s-001');

    expect(app.syncState).toBeUndefined();
  });

  it('keeps the sync reasons shown in the tooltip', async () => {
    mockClient.getApplication.mockResolvedValue({
      application: genApp({
        syncState: {
          status: 3,
          shortReason: 'There are 2 manifests not synced',
          reason: 'Deployment frontend: replicas changed',
          timestamp: BigInt(0),
        },
      }),
    });

    const app = await getApplication(MOCK_CONFIG, 'app-k8s-001');

    expect(app.syncState?.shortReason).toBe('There are 2 manifests not synced');
    expect(app.syncState?.reason).toBe('Deployment frontend: replicas changed');
  });

  it('maps the git path, defaulting missing repo fields to empty strings', async () => {
    mockClient.getApplication.mockResolvedValue({
      application: genApp({
        gitPath: {
          repo: undefined,
          path: 'k8s/overlays/prod',
          configFilename: 'app.pipecd.yaml',
          url: 'https://github.com/myorg/frontend/tree/main/k8s/overlays/prod',
        },
      }),
    });

    const app = await getApplication(MOCK_CONFIG, 'app-k8s-001');

    expect(app.gitPath).toEqual({
      repo: { id: '', remote: '', branch: '' },
      path: 'k8s/overlays/prod',
      configFilename: 'app.pipecd.yaml',
      url: 'https://github.com/myorg/frontend/tree/main/k8s/overlays/prod',
    });
  });

  it('leaves the git path out when the server sends none', async () => {
    mockClient.getApplication.mockResolvedValue({ application: genApp() });

    const app = await getApplication(MOCK_CONFIG, 'app-k8s-001');

    expect(app.gitPath).toBeUndefined();
  });

  // The generated field is mostRecentlySuccessfulDeployment; ours drops the
  // "ly". Mapping the wrong name silently leaves the Last Synced column empty.
  it('maps the most recent successful deployment, including its commit', async () => {
    mockClient.getApplication.mockResolvedValue({
      application: genApp({
        mostRecentlySuccessfulDeployment: {
          deploymentId: 'deploy-001',
          trigger: { commander: '', timestamp: BigInt(1721990000), commit: genCommit },
          summary: 'feat: add dark mode',
          version: 'v1.4.2',
          startedAt: BigInt(1721990100),
          completedAt: BigInt(1721990300),
        },
      }),
    });

    const app = await getApplication(MOCK_CONFIG, 'app-k8s-001');

    expect(app.mostRecentSuccessfulDeployment).toEqual({
      deploymentId: 'deploy-001',
      trigger: {
        commander: '',
        timestamp: 1721990000,
        commit: { ...genCommit, createdAt: 1721990000 },
      },
      summary: 'feat: add dark mode',
      version: 'v1.4.2',
      startedAt: 1721990100,
      completedAt: 1721990300,
    });
  });

  it('maps the most recently triggered deployment', async () => {
    mockClient.getApplication.mockResolvedValue({
      application: genApp({
        mostRecentlyTriggeredDeployment: {
          deploymentId: 'deploy-002',
          trigger: { commander: 'api-key-id', timestamp: BigInt(1722000000) },
          summary: 'Sync triggered from the API',
          version: 'v1.5.0',
          startedAt: BigInt(1722000010),
          completedAt: BigInt(0),
        },
      }),
    });

    const app = await getApplication(MOCK_CONFIG, 'app-k8s-001');

    expect(app.mostRecentlyTriggeredDeployment?.deploymentId).toBe('deploy-002');
    expect(app.mostRecentlyTriggeredDeployment?.trigger.commander).toBe('api-key-id');
    expect(app.mostRecentlyTriggeredDeployment?.trigger.commit).toBeUndefined();
    expect(app.mostRecentlyTriggeredDeployment?.completedAt).toBe(0);
  });

  it('keeps the disabled flag, labels and description', async () => {
    mockClient.getApplication.mockResolvedValue({
      application: genApp({
        disabled: true,
        labels: { env: 'prod' },
        description: 'Production frontend',
      }),
    });

    const app = await getApplication(MOCK_CONFIG, 'app-k8s-001');

    expect(app.disabled).toBe(true);
    expect(app.labels).toEqual({ env: 'prod' });
    expect(app.description).toBe('Production frontend');
  });
});

describe('listApplications request', () => {
  it('sends an empty cursor and no limit by default', async () => {
    mockClient.listApplications.mockResolvedValue({ applications: [], cursor: '' });

    await listApplications(MOCK_CONFIG);

    expect(mockClient.listApplications).toHaveBeenCalledWith(
      expect.objectContaining({ kind: '', cursor: '', limit: 0 }),
      expect.anything()
    );
  });

  it('passes the cursor through so the next page can be fetched', async () => {
    mockClient.listApplications.mockResolvedValue({ applications: [], cursor: '' });

    await listApplications(MOCK_CONFIG, { cursor: 'page-2' });

    expect(mockClient.listApplications).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: 'page-2' }),
      expect.anything()
    );
  });

  it('returns the cursor the server handed back', async () => {
    mockClient.listApplications.mockResolvedValue({ applications: [genApp()], cursor: 'next' });

    const result = await listApplications(MOCK_CONFIG);

    expect(result.cursor).toBe('next');
  });

  it('forwards the abort signal to the RPC', async () => {
    mockClient.listApplications.mockResolvedValue({ applications: [], cursor: '' });
    const controller = new AbortController();

    await listApplications(MOCK_CONFIG, { signal: controller.signal });

    expect(mockClient.listApplications).toHaveBeenCalledWith(expect.anything(), {
      signal: controller.signal,
    });
  });

  it('points the transport at the configured server', async () => {
    mockClient.listApplications.mockResolvedValue({ applications: [], cursor: '' });

    await listApplications(MOCK_CONFIG);

    expect(vi.mocked(createGrpcWebTransport)).toHaveBeenCalledWith(
      expect.objectContaining({ baseUrl: 'https://pipecd.example.com' })
    );
  });
});

describe('error handling', () => {
  it('names the RPC and keeps the server message in the error', async () => {
    mockClient.getApplication.mockRejectedValue(
      new ConnectError('application not found', Code.NotFound)
    );

    const err = await getApplication(MOCK_CONFIG, 'missing').catch(e => e);

    expect(err).toBeInstanceOf(PipeCDApiError);
    expect(err.message).toContain('GetApplication');
    expect(err.message).toContain('application not found');
    expect(err.status).toBe(Code.NotFound);
    expect(err.responseBody).toBe('application not found');
  });

  it('wraps a thrown non-Error value in an Error', async () => {
    mockClient.listApplications.mockRejectedValue('socket hang up');

    const err = await listApplications(MOCK_CONFIG).catch(e => e);

    expect(err).toBeInstanceOf(Error);
    expect(err.message).toBe('socket hang up');
  });

  it('reports a cancelled deployment request as an AbortError', async () => {
    mockClient.listDeployments.mockRejectedValue(new ConnectError('cancelled', Code.Canceled));

    await expect(listDeployments(MOCK_CONFIG)).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('reports PermissionDenied as an API error, not a cancellation', async () => {
    mockClient.listApplications.mockRejectedValue(
      new ConnectError('permission denied', Code.PermissionDenied)
    );

    const err = await listApplications(MOCK_CONFIG).catch(e => e);

    expect(err).toBeInstanceOf(PipeCDApiError);
    expect(err.name).toBe('PipeCDApiError');
    expect(err.status).toBe(Code.PermissionDenied);
  });
});

describe('listDeployments request', () => {
  it('filters by status via the statuses RPC field', async () => {
    mockClient.listDeployments.mockResolvedValue({ deployments: [], cursor: '' });

    await listDeployments(MOCK_CONFIG, { status: 'DEPLOYMENT_RUNNING' });

    expect(mockClient.listDeployments).toHaveBeenCalledWith(
      expect.objectContaining({ statuses: ['DEPLOYMENT_RUNNING'] }),
      expect.anything()
    );
  });

  it('sends empty filters when none are given', async () => {
    mockClient.listDeployments.mockResolvedValue({ deployments: [], cursor: '' });

    await listDeployments(MOCK_CONFIG);

    expect(mockClient.listDeployments).toHaveBeenCalledWith(
      expect.objectContaining({ applicationIds: [], statuses: [], cursor: '', limit: 0 }),
      expect.anything()
    );
  });

  it('passes the cursor and page size through', async () => {
    mockClient.listDeployments.mockResolvedValue({ deployments: [], cursor: 'more' });

    const result = await listDeployments(MOCK_CONFIG, { cursor: 'page-2', pageSize: 20 });

    expect(mockClient.listDeployments).toHaveBeenCalledWith(
      expect.objectContaining({ cursor: 'page-2', limit: 20 }),
      expect.anything()
    );
    expect(result.cursor).toBe('more');
  });
});

describe('getDeployment', () => {
  it('fetches a deployment by id', async () => {
    mockClient.getDeployment.mockResolvedValue({ deployment: genDeployment() });

    const deployment = await getDeployment(MOCK_CONFIG, 'dep-1');

    expect(mockClient.getDeployment).toHaveBeenCalledWith({ deploymentId: 'dep-1' });
    expect(deployment.id).toBe('dep-1');
    expect(deployment.applicationName).toBe('frontend-prod');
    expect(deployment.summary).toBe('Quick sync');
  });

  it('throws a not-found PipeCDApiError when the server returns no deployment', async () => {
    mockClient.getDeployment.mockResolvedValue({ deployment: undefined });

    const err = await getDeployment(MOCK_CONFIG, 'missing').catch(e => e);

    expect(err).toBeInstanceOf(PipeCDApiError);
    expect(err.status).toBe(Code.NotFound);
    expect(err.message).toContain('missing');
  });

  it('wraps a server error as PipeCDApiError', async () => {
    mockClient.getDeployment.mockRejectedValue(new ConnectError('boom', Code.Internal));

    await expect(getDeployment(MOCK_CONFIG, 'dep-1')).rejects.toBeInstanceOf(PipeCDApiError);
  });

  it.each([
    [0, 'DEPLOYMENT_PENDING'],
    [1, 'DEPLOYMENT_PLANNED'],
    [2, 'DEPLOYMENT_RUNNING'],
    [3, 'DEPLOYMENT_ROLLING_BACK'],
    [4, 'DEPLOYMENT_SUCCESS'],
    [5, 'DEPLOYMENT_FAILURE'],
    [6, 'DEPLOYMENT_CANCELLED'],
  ])('maps deployment status %i to %s', async (status, expected) => {
    mockClient.getDeployment.mockResolvedValue({ deployment: genDeployment({ status }) });

    const deployment = await getDeployment(MOCK_CONFIG, 'dep-1');

    expect(deployment.status).toBe(expected);
  });

  it('falls back to pending for a deployment status it does not know', async () => {
    mockClient.getDeployment.mockResolvedValue({ deployment: genDeployment({ status: 99 }) });

    const deployment = await getDeployment(MOCK_CONFIG, 'dep-1');

    expect(deployment.status).toBe('DEPLOYMENT_PENDING');
  });

  it('maps the trigger commit and converts its timestamps', async () => {
    mockClient.getDeployment.mockResolvedValue({
      deployment: genDeployment({
        trigger: { commander: '', timestamp: BigInt(1721990000), commit: genCommit },
      }),
    });

    const deployment = await getDeployment(MOCK_CONFIG, 'dep-1');

    expect(deployment.trigger.timestamp).toBe(1721990000);
    expect(deployment.trigger.commit?.author).toBe('Alice Dev');
    expect(deployment.trigger.commit?.createdAt).toBe(1721990000);
  });

  it('gives an empty trigger when the server sends none', async () => {
    mockClient.getDeployment.mockResolvedValue({ deployment: genDeployment() });

    const deployment = await getDeployment(MOCK_CONFIG, 'dep-1');

    expect(deployment.trigger).toEqual({ commander: '', timestamp: 0, commit: undefined });
  });

  it('maps every pipeline stage in order', async () => {
    mockClient.getDeployment.mockResolvedValue({
      deployment: genDeployment({
        stages: [
          genStage({ id: 's1', name: 'K8S_CANARY_ROLLOUT', index: 0 }),
          genStage({ id: 's2', name: 'K8S_PRIMARY_ROLLOUT', index: 1, requires: ['s1'] }),
          genStage({ id: 's3', name: 'ROLLBACK', index: 2, rollback: true, status: 0 }),
        ],
      }),
    });

    const deployment = await getDeployment(MOCK_CONFIG, 'dep-1');

    expect(deployment.stages.map(s => s.id)).toEqual(['s1', 's2', 's3']);
    expect(deployment.stages[1].requiresList).toEqual(['s1']);
    expect(deployment.stages[2].rollback).toBe(true);
  });

  it('converts stage timestamps and keeps the retry count', async () => {
    mockClient.getDeployment.mockResolvedValue({
      deployment: genDeployment({ stages: [genStage({ retriedCount: 2 })] }),
    });

    const [stage] = (await getDeployment(MOCK_CONFIG, 'dep-1')).stages;

    expect(stage.createdAt).toBe(1722000000);
    expect(stage.completedAt).toBe(1722000060);
    expect(stage.retriedCount).toBe(2);
  });

  it.each([
    [0, 'STAGE_NOT_STARTED_YET'],
    [1, 'STAGE_RUNNING'],
    [2, 'STAGE_SUCCESS'],
    [3, 'STAGE_FAILURE'],
    [4, 'STAGE_CANCELLED'],
    [5, 'STAGE_SKIPPED'],
    [6, 'STAGE_EXITED'],
  ])('maps stage status %i to %s', async (status, expected) => {
    mockClient.getDeployment.mockResolvedValue({
      deployment: genDeployment({ stages: [genStage({ status })] }),
    });

    const [stage] = (await getDeployment(MOCK_CONFIG, 'dep-1')).stages;

    expect(stage.status).toBe(expected);
  });

  it('treats a stage status it does not know as not started', async () => {
    mockClient.getDeployment.mockResolvedValue({
      deployment: genDeployment({ stages: [genStage({ status: 99 })] }),
    });

    const [stage] = (await getDeployment(MOCK_CONFIG, 'dep-1')).stages;

    expect(stage.status).toBe('STAGE_NOT_STARTED_YET');
  });
});
