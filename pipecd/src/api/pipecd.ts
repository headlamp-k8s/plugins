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

import { Code, ConnectError, createClient } from '@connectrpc/connect';
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
import type { LogBlock as GenLogBlock } from '../generated/pkg/model/logblock_pb';
import { LogSeverity as GenLogSeverity } from '../generated/pkg/model/logblock_pb';
import type {
  Application,
  ApplicationKind,
  Deployment,
  DeploymentStatus,
  DeploymentTrigger,
  GitPath,
  ListApplicationsResponse,
  ListDeploymentsResponse,
  ListStageLogsResponse,
  LogBlock,
  LogSeverity,
  PipelineStage,
  StageStatus,
  SyncStatus,
} from '../types/pipecd';

export interface PipeCDConfig {
  baseURL: string;
  apiKey: string;
}

let currentConfig: PipeCDConfig | undefined;

// Remove legacy persisted credentials when the plugin loads, without reading them.
localStorage.removeItem('pipecd-plugin-api-key');

export function loadConfig(): PipeCDConfig {
  if (currentConfig) return { ...currentConfig };

  return {
    baseURL: localStorage.getItem('pipecd-plugin-base-url') ?? '',
    apiKey: '',
  };
}

export function saveConfig(config: PipeCDConfig): void {
  localStorage.setItem('pipecd-plugin-base-url', config.baseURL);
  // Keep the key paired with its URL even if another tab updates localStorage.
  currentConfig = { ...config };
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
      // An aborted request is not a failure. Re-throw it as an AbortError so
      // callers can drop it instead of rendering an error for a request they
      // themselves cancelled.
      if (err.code === Code.Canceled) {
        const aborted = new Error(`${rpcName} was cancelled`);
        aborted.name = 'AbortError';
        throw aborted;
      }
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

const LOG_SEVERITY_MAP: Record<number, LogSeverity> = {
  [GenLogSeverity.INFO]: 'INFO',
  [GenLogSeverity.SUCCESS]: 'SUCCESS',
  [GenLogSeverity.ERROR]: 'ERROR',
};

/** Plugin names as they appear in deployTargetsByPlugin. */
const PLUGIN_KINDS: Record<string, ApplicationKind> = {
  kubernetes: 'KUBERNETES',
  kubernetes_multicluster: 'KUBERNETES',
  terraform: 'TERRAFORM',
  cloudrun: 'CLOUD_RUN',
  lambda: 'LAMBDA',
  ecs: 'ECS',
};

/**
 * Works out which platform an application or deployment targets.
 *
 * The `kind` field is deprecated on both messages, and a plugin-arch (v1) piped
 * does not set it, so it arrives as the protobuf zero value and everything
 * would look like Kubernetes. Prefer the deploy targets, which name the plugin,
 * and fall back to the old field only when there are none. Deploy targets with
 * no known plugin mean a v1 piped too, so the old field is just as unreliable
 * there and the platform is reported as unknown.
 */
function resolveKind(source: {
  kind: GenApplication['kind'] | GenDeployment['kind'];
  deployTargetsByPlugin?: Record<string, unknown>;
}): ApplicationKind {
  const plugins = Object.keys(source.deployTargetsByPlugin ?? {});
  for (const plugin of plugins) {
    const kind = PLUGIN_KINDS[plugin.toLowerCase()];
    if (kind) return kind;
  }
  if (plugins.length > 0) return 'UNKNOWN';
  return KIND_MAP[source.kind] ?? 'UNKNOWN';
}

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

/**
 * PipeCD reports a running deployment through `deploying`, separately from the
 * drift-based sync state, and its console lets that flag win. Do the same, or
 * an app mid-deploy shows its previous SYNCED state.
 */
function mapSyncState(a: GenApplication): Application['syncState'] {
  if (!a.syncState) {
    return a.deploying ? { status: 'DEPLOYING', timestamp: 0 } : undefined;
  }
  return {
    status: a.deploying ? 'DEPLOYING' : SYNC_STATUS_MAP[a.syncState.status] ?? 'UNKNOWN',
    shortReason: a.syncState.shortReason,
    reason: a.syncState.reason,
    timestamp: toNumber(a.syncState.timestamp),
  };
}

function mapApplication(a: GenApplication): Application {
  return {
    id: a.id,
    name: a.name,
    pipedId: a.pipedId,
    projectId: a.projectId,
    kind: resolveKind(a),
    gitPath: mapGitPath(a.gitPath),
    cloudProvider: a.cloudProvider,
    description: a.description,
    labels: a.labels,
    syncState: mapSyncState(a),
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
    mostRecentlyTriggeredDeployment: a.mostRecentlyTriggeredDeployment
      ? {
          deploymentId: a.mostRecentlyTriggeredDeployment.deploymentId,
          trigger: mapTrigger(a.mostRecentlyTriggeredDeployment.trigger),
          summary: a.mostRecentlyTriggeredDeployment.summary,
          version: a.mostRecentlyTriggeredDeployment.version,
          startedAt: toNumber(a.mostRecentlyTriggeredDeployment.startedAt),
          completedAt: toNumber(a.mostRecentlyTriggeredDeployment.completedAt),
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
    requiresList: s.requires,
    rollback: s.rollback,
    retriedCount: s.retriedCount,
    status: STAGE_STATUS_MAP[s.status] ?? 'STAGE_NOT_STARTED_YET',
    statusReason: s.statusReason,
    metadata: s.metadata,
    retrievedAt: 0,
    createdAt: toNumber(s.createdAt),
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
    kind: resolveKind(d),
    gitPath: mapGitPath(d.gitPath),
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
  kind?: ApplicationKind;
  cursor?: string;
  pageSize?: number;
  signal?: AbortSignal;
}

export async function listApplications(
  config: PipeCDConfig,
  options: ListApplicationsOptions = {}
): Promise<ListApplicationsResponse> {
  const client = getClient(config);
  const fetchPage = (cursor: string) =>
    call('ListApplications', () =>
      client.listApplications(
        {
          // The server filters `kind` on the deprecated field, which a v1 piped
          // leaves at KUBERNETES, so never send it. See the filter below.
          kind: '',
          cursor,
          limit: options.pageSize ?? 0,
          name: '',
          disabled: false,
          labels: {},
          pipedId: '',
        },
        { signal: options.signal }
      )
    );

  if (!options.kind) {
    const resp = await fetchPage(options.cursor ?? '');
    return { applications: resp.applications.map(mapApplication), cursor: resp.cursor };
  }

  // Filter on the resolved platform instead. Matches can sit on any page, so
  // walk them all here rather than hand back pages that may be empty. Stop if
  // the server repeats a cursor, and skip ids already seen.
  const seen = new Set<string>();
  const matches: Application[] = [];
  let cursor = options.cursor ?? '';
  for (;;) {
    const resp = await fetchPage(cursor);
    for (const gen of resp.applications) {
      if (seen.has(gen.id)) continue;
      seen.add(gen.id);
      const app = mapApplication(gen);
      if (app.kind === options.kind) matches.push(app);
    }
    if (!resp.cursor || resp.cursor === cursor || resp.applications.length === 0) break;
    cursor = resp.cursor;
  }
  return { applications: matches, cursor: '' };
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
    client.listDeployments(
      {
        applicationIds: options.applicationId ? [options.applicationId] : [],
        statuses: options.status ? [options.status] : [],
        kinds: [],
        applicationName: '',
        labels: {},
        limit: options.pageSize ?? 0,
        cursor: options.cursor ?? '',
      },
      { signal: options.signal }
    )
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

function mapLogBlock(b: GenLogBlock): LogBlock {
  return {
    index: toNumber(b.index),
    log: b.log,
    severity: LOG_SEVERITY_MAP[b.severity] ?? 'INFO',
    createdAt: toNumber(b.createdAt),
  };
}

export async function listStageLogs(
  config: PipeCDConfig,
  deploymentId: string
): Promise<ListStageLogsResponse> {
  const client = getClient(config);
  const resp = await call('ListStageLogs', () => client.listStageLogs({ deploymentId }));
  const stageLogs: ListStageLogsResponse['stageLogs'] = {};
  for (const [stageId, stageLog] of Object.entries(resp.stageLogs)) {
    stageLogs[stageId] = {
      blocks: stageLog.blocks.map(mapLogBlock),
      completed: stageLog.completed,
    };
  }
  return { stageLogs };
}
