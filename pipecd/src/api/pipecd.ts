import { ConnectError, createClient } from '@connectrpc/connect';
import { createGrpcWebTransport } from '@connectrpc/connect-web';
import { APIService } from '../generated/pkg/app/server/service/apiservice/service_pb';
import type { Application as GenApplication } from '../generated/pkg/model/application_pb';
import { ApplicationSyncStatus as GenSyncStatus } from '../generated/pkg/model/application_pb';
import type { ApplicationGitPath as GenGitPath } from '../generated/pkg/model/common_pb';
import { ApplicationKind as GenApplicationKind } from '../generated/pkg/model/common_pb';
import type {
  Deployment as GenDeployment,
  PipelineStage as GenPipelineStage,
} from '../generated/pkg/model/deployment_pb';
import {
  DeploymentStatus as GenDeploymentStatus,
  StageStatus as GenStageStatus,
} from '../generated/pkg/model/deployment_pb';
import type {
  Application,
  ApplicationKind,
  Deployment,
  DeploymentStatus,
  DeploymentTrigger,
  GitPath,
  ListApplicationsResponse,
  ListDeploymentsResponse,
  PipelineStage,
  StageStatus,
  SyncStatus,
} from '../types/pipecd';

export interface PipeCDConfig {
  baseURL: string;
  apiKey: string;
}

export function loadConfig(): PipeCDConfig {
  return {
    baseURL: localStorage.getItem('pipecd-plugin-base-url') ?? '',
    apiKey: localStorage.getItem('pipecd-plugin-api-key') ?? '',
  };
}

export function saveConfig(config: PipeCDConfig): void {
  localStorage.setItem('pipecd-plugin-base-url', config.baseURL);
  localStorage.setItem('pipecd-plugin-api-key', config.apiKey);
}

export function isConfigured(config: PipeCDConfig): boolean {
  return config.baseURL.length > 0 && config.apiKey.length > 0;
}

export class PipeCDApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly responseBody: string
  ) {
    super(message);
    this.name = 'PipeCDApiError';
  }
}

function getClient(config: PipeCDConfig) {
  const transport = createGrpcWebTransport({
    baseUrl: config.baseURL,
    interceptors: [
      next => async req => {
        req.header.set('authorization', `API-KEY ${config.apiKey}`);
        return next(req);
      },
    ],
  });
  return createClient(APIService, transport);
}

async function call<T>(rpcName: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ConnectError) {
      throw new PipeCDApiError(
        `PipeCD API error calling ${rpcName}: ${err.rawMessage}`,
        err.code,
        err.rawMessage
      );
    }
    throw err instanceof Error ? err : new Error(String(err));
  }
}

function toNumber(v: bigint | number | undefined): number {
  if (v === undefined) return 0;
  return typeof v === 'bigint' ? Number(v) : v;
}

const KIND_MAP: Record<number, ApplicationKind> = {
  [GenApplicationKind.KUBERNETES]: 'KUBERNETES',
  [GenApplicationKind.TERRAFORM]: 'TERRAFORM',
  [GenApplicationKind.LAMBDA]: 'LAMBDA',
  [GenApplicationKind.CLOUDRUN]: 'CLOUD_RUN',
  [GenApplicationKind.ECS]: 'ECS',
};

const SYNC_STATUS_MAP: Record<number, SyncStatus> = {
  [GenSyncStatus.UNKNOWN]: 'UNKNOWN',
  [GenSyncStatus.SYNCED]: 'SYNCED',
  [GenSyncStatus.DEPLOYING]: 'DEPLOYING',
  [GenSyncStatus.OUT_OF_SYNC]: 'OUT_OF_SYNC',
  [GenSyncStatus.INVALID_CONFIG]: 'INVALID_CONFIG',
};

const DEPLOYMENT_STATUS_MAP: Record<number, DeploymentStatus> = {
  [GenDeploymentStatus.DEPLOYMENT_PENDING]: 'DEPLOYMENT_PENDING',
  [GenDeploymentStatus.DEPLOYMENT_PLANNED]: 'DEPLOYMENT_PLANNED',
  [GenDeploymentStatus.DEPLOYMENT_RUNNING]: 'DEPLOYMENT_RUNNING',
  [GenDeploymentStatus.DEPLOYMENT_ROLLING_BACK]: 'DEPLOYMENT_ROLLING_BACK',
  [GenDeploymentStatus.DEPLOYMENT_SUCCESS]: 'DEPLOYMENT_SUCCESS',
  [GenDeploymentStatus.DEPLOYMENT_FAILURE]: 'DEPLOYMENT_FAILURE',
  [GenDeploymentStatus.DEPLOYMENT_CANCELLED]: 'DEPLOYMENT_CANCELLED',
};

const STAGE_STATUS_MAP: Record<number, StageStatus> = {
  [GenStageStatus.STAGE_NOT_STARTED_YET]: 'STAGE_NOT_STARTED_YET',
  [GenStageStatus.STAGE_RUNNING]: 'STAGE_RUNNING',
  [GenStageStatus.STAGE_SUCCESS]: 'STAGE_SUCCESS',
  [GenStageStatus.STAGE_FAILURE]: 'STAGE_FAILURE',
  [GenStageStatus.STAGE_CANCELLED]: 'STAGE_CANCELLED',
  [GenStageStatus.STAGE_SKIPPED]: 'STAGE_SKIPPED',
  [GenStageStatus.STAGE_EXITED]: 'STAGE_EXITED',
};

function mapGitPath(gp: GenGitPath | undefined): GitPath | undefined {
  if (!gp) return undefined;
  return {
    repo: { id: gp.repo?.id ?? '', remote: gp.repo?.remote ?? '', branch: gp.repo?.branch ?? '' },
    path: gp.path,
    configFilename: gp.configFilename,
    url: gp.url,
  };
}

function mapTrigger(t: GenDeployment['trigger']): DeploymentTrigger {
  return {
    commander: t?.commander ?? '',
    timestamp: toNumber(t?.timestamp),
    commit: t?.commit
      ? {
          hash: t.commit.hash,
          message: t.commit.message,
          author: t.commit.author,
          branch: t.commit.branch,
          url: t.commit.url,
          createdAt: toNumber(t.commit.createdAt),
        }
      : undefined,
  };
}

function mapApplication(a: GenApplication): Application {
  return {
    id: a.id,
    name: a.name,
    pipedId: a.pipedId,
    projectId: a.projectId,
    kind: KIND_MAP[a.kind] ?? 'KUBERNETES',
    gitPath: mapGitPath(a.gitPath),
    cloudProvider: a.cloudProvider,
    description: a.description,
    labels: a.labels,
    syncState: a.syncState
      ? {
          status: SYNC_STATUS_MAP[a.syncState.status] ?? 'UNKNOWN',
          shortReason: a.syncState.shortReason,
          reason: a.syncState.reason,
          timestamp: toNumber(a.syncState.timestamp),
        }
      : undefined,
    mostRecentSuccessfulDeployment: a.mostRecentlySuccessfulDeployment
      ? {
          deploymentId: a.mostRecentlySuccessfulDeployment.deploymentId,
          trigger: mapTrigger(a.mostRecentlySuccessfulDeployment.trigger),
          summary: a.mostRecentlySuccessfulDeployment.summary,
          version: a.mostRecentlySuccessfulDeployment.version,
          startedAt: toNumber(a.mostRecentlySuccessfulDeployment.startedAt),
          completedAt: toNumber(a.mostRecentlySuccessfulDeployment.completedAt),
        }
      : undefined,
    disabled: a.disabled,
    createdAt: toNumber(a.createdAt),
    updatedAt: toNumber(a.updatedAt),
  };
}

function mapStage(s: GenPipelineStage): PipelineStage {
  return {
    id: s.id,
    name: s.name,
    desc: s.desc,
    index: s.index,
    predefined: s.predefined,
    requiresList: s.requires,
    visible: s.visible,
    status: STAGE_STATUS_MAP[s.status] ?? 'STAGE_NOT_STARTED_YET',
    statusReason: s.statusReason,
    metadata: s.metadata,
    retrievedAt: 0,
    startedAt: toNumber(s.createdAt),
    completedAt: toNumber(s.completedAt),
  };
}

function mapDeployment(d: GenDeployment): Deployment {
  return {
    id: d.id,
    applicationId: d.applicationId,
    applicationName: d.applicationName,
    pipedId: d.pipedId,
    projectId: d.projectId,
    kind: KIND_MAP[d.kind] ?? 'KUBERNETES',
    gitPath: mapGitPath(d.gitPath) ?? {
      repo: { id: '', remote: '', branch: '' },
      path: '',
      configFilename: '',
      url: '',
    },
    cloudProvider: d.cloudProvider,
    trigger: mapTrigger(d.trigger),
    summary: d.summary,
    labels: d.labels,
    status: DEPLOYMENT_STATUS_MAP[d.status] ?? 'DEPLOYMENT_PENDING',
    statusReason: d.statusReason,
    stages: d.stages.map(mapStage),
    deployStageSummary: '',
    completedAt: toNumber(d.completedAt),
    createdAt: toNumber(d.createdAt),
    updatedAt: toNumber(d.updatedAt),
  };
}

export interface ListApplicationsOptions {
  kind?: string;
  cursor?: string;
  pageSize?: number;
  signal?: AbortSignal;
}

export async function listApplications(
  config: PipeCDConfig,
  options: ListApplicationsOptions = {}
): Promise<ListApplicationsResponse> {
  const client = getClient(config);
  const resp = await call('ListApplications', () =>
    client.listApplications({
      kind: options.kind ?? '',
      cursor: options.cursor ?? '',
      limit: options.pageSize ?? 0,
      name: '',
      disabled: false,
      labels: {},
      pipedId: '',
    })
  );
  return { applications: resp.applications.map(mapApplication), cursor: resp.cursor };
}

export async function getApplication(
  config: PipeCDConfig,
  applicationId: string
): Promise<Application> {
  const client = getClient(config);
  const resp = await call('GetApplication', () => client.getApplication({ applicationId }));
  if (!resp.application) {
    throw new PipeCDApiError(`PipeCD API returned no application for ${applicationId}`, 5, '');
  }
  return mapApplication(resp.application);
}

export interface ListDeploymentsOptions {
  applicationId?: string;
  status?: string;
  cursor?: string;
  pageSize?: number;
  signal?: AbortSignal;
}

export async function listDeployments(
  config: PipeCDConfig,
  options: ListDeploymentsOptions = {}
): Promise<ListDeploymentsResponse> {
  const client = getClient(config);
  const resp = await call('ListDeployments', () =>
    client.listDeployments({
      applicationIds: options.applicationId ? [options.applicationId] : [],
      statuses: options.status ? [options.status] : [],
      kinds: [],
      applicationName: '',
      labels: {},
      limit: options.pageSize ?? 0,
      cursor: options.cursor ?? '',
    })
  );
  return { deployments: resp.deployments.map(mapDeployment), cursor: resp.cursor };
}

export async function getDeployment(
  config: PipeCDConfig,
  deploymentId: string
): Promise<Deployment> {
  const client = getClient(config);
  const resp = await call('GetDeployment', () => client.getDeployment({ deploymentId }));
  if (!resp.deployment) {
    throw new PipeCDApiError(`PipeCD API returned no deployment for ${deploymentId}`, 5, '');
  }
  return mapDeployment(resp.deployment);
}
