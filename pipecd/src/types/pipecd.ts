export type ApplicationKind = 'KUBERNETES' | 'TERRAFORM' | 'CLOUD_RUN' | 'LAMBDA' | 'ECS';

export type SyncStatus = 'UNKNOWN' | 'SYNCED' | 'DEPLOYING' | 'OUT_OF_SYNC' | 'INVALID_CONFIG';

export interface ApplicationSyncState {
  status: SyncStatus;
  shortReason?: string;
  reason?: string;
  timestamp: number;
}

export interface DeploymentTrigger {
  commit?: {
    hash: string;
    message: string;
    author: string;
    branch: string;
    url: string;
    createdAt: number;
  };
  commander: string;
  timestamp: number;
}

export interface DeploymentReference {
  deploymentId: string;
  trigger: DeploymentTrigger;
  summary: string;
  version: string;
  startedAt: number;
  completedAt: number;
}

export interface GitPath {
  repo: {
    id: string;
    remote: string;
    branch: string;
  };
  path: string;
  configFilename: string;
  url: string;
}

export interface Application {
  id: string;
  name: string;
  pipedId: string;
  projectId: string;
  kind: ApplicationKind;
  gitPath?: GitPath;
  cloudProvider?: string;
  description?: string;
  labels?: Record<string, string>;
  syncState?: ApplicationSyncState;
  mostRecentSuccessfulDeployment?: DeploymentReference;
  mostRecentlyTriggeredDeployment?: DeploymentReference;
  disabled: boolean;
  createdAt: number;
  updatedAt: number;
}

export type DeploymentStatus =
  | 'DEPLOYMENT_PENDING'
  | 'DEPLOYMENT_PLANNED'
  | 'DEPLOYMENT_RUNNING'
  | 'DEPLOYMENT_ROLLING_BACK'
  | 'DEPLOYMENT_SUCCESS'
  | 'DEPLOYMENT_FAILURE'
  | 'DEPLOYMENT_CANCELLED';

export type StageStatus =
  | 'STAGE_NOT_STARTED_YET'
  | 'STAGE_RUNNING'
  | 'STAGE_SUCCESS'
  | 'STAGE_FAILURE'
  | 'STAGE_CANCELLED'
  | 'STAGE_SKIPPED'
  | 'STAGE_EXITED';

export interface PipelineStage {
  id: string;
  name: string;
  desc: string;
  index: number;
  predefined: boolean;
  requiresList: string[];
  visible: boolean;
  status: StageStatus;
  statusReason: string;
  metadata: Record<string, string>;
  retrievedAt: number;
  startedAt: number;
  completedAt: number;
}

export interface Deployment {
  id: string;
  applicationId: string;
  applicationName: string;
  pipedId: string;
  projectId: string;
  kind: ApplicationKind;
  gitPath: GitPath;
  cloudProvider: string;
  trigger: DeploymentTrigger;
  summary: string;
  labels: Record<string, string>;
  status: DeploymentStatus;
  statusReason: string;
  stages: PipelineStage[];
  deployStageSummary: string;
  completedAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface ListApplicationsResponse {
  applications: Application[];
  cursor: string;
}

export interface GetApplicationResponse {
  application: Application;
}

export interface ListDeploymentsResponse {
  deployments: Deployment[];
  cursor: string;
}

export interface GetDeploymentResponse {
  deployment: Deployment;
}
