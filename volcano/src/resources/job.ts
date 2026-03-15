import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export interface TaskSpec {
  name: string;
  replicas: number;
  minAvailable?: number;
  maxRetry?: number;
  dependsOn?: {
    name: string[];
    iteration?: 'any' | 'all';
  };
  template: {
    spec: {
      containers: {
        name: string;
        image: string;
        command?: string[];
        resources?: Record<string, unknown>;
      }[];
      restartPolicy?: string;
    };
  };
  policies?: LifecyclePolicy[];
}

export interface LifecyclePolicy {
  action?: string;
  event?: string;
  events?: string[];
  exitCode?: number;
  timeout?: string;
}

export interface VolumeSpec {
  mountPath: string;
  volumeClaimName?: string;
  volumeClaim?: Record<string, unknown>;
}

export interface VolcanoJobSpec {
  schedulerName?: string;
  minAvailable?: number;
  minSuccess?: number;
  queue?: string;
  maxRetry?: number;
  ttlSecondsAfterFinished?: number;
  priorityClassName?: string;
  runningEstimate?: string;
  tasks?: TaskSpec[];
  policies?: LifecyclePolicy[];
  plugins?: Record<string, string[]>;
  volumes?: VolumeSpec[];
}

export type JobPhase =
  | 'Pending'
  | 'Aborting'
  | 'Aborted'
  | 'Running'
  | 'Restarting'
  | 'Completing'
  | 'Completed'
  | 'Terminating'
  | 'Terminated'
  | 'Failed';

export interface JobState {
  phase: JobPhase;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

export interface JobCondition {
  type?: string;
  status: JobPhase;
  lastTransitionTime?: string;
  reason?: string;
  message?: string;
}

export interface VolcanoJobStatus {
  state?: JobState;
  minAvailable?: number;
  pending?: number;
  running?: number;
  succeeded?: number;
  failed?: number;
  terminating?: number;
  unknown?: number;
  retryCount?: number;
  version?: number;
  runningDuration?: string;
  controlledResources?: Record<string, string>;
  taskStatusCount?: Record<string, Record<string, number>>;
  conditions?: JobCondition[];
}

export interface KubeVolcanoJob extends KubeObjectInterface {
  spec: VolcanoJobSpec;
  status?: VolcanoJobStatus;
}

export class VolcanoJob extends KubeObject<KubeVolcanoJob> {
  static kind = 'VolcanoJob';
  static apiName = 'jobs';
  static apiVersion = 'batch.volcano.sh/v1alpha1';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/volcano/jobs/:namespace/:name';
  }

  static getBaseObject() {
    return {
      apiVersion: 'batch.volcano.sh/v1alpha1',
      kind: 'Job',
      metadata: {
        name: '',
        namespace: '',
      },
      spec: {
        schedulerName: 'volcano',
        minAvailable: 1,
        queue: 'default',
        tasks: [
          {
            replicas: 1,
            name: 'task',
            template: {
              spec: {
                containers: [
                  {
                    name: 'container',
                    image: '',
                  },
                ],
                restartPolicy: 'Never',
              },
            },
          },
        ],
      },
    };
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get phase(): JobPhase {
    return this.status?.state?.phase || 'Pending';
  }

  get queue(): string {
    return this.spec.queue || 'default';
  }

  get minAvailable(): number {
    return this.spec.minAvailable || 0;
  }

  get runningCount(): number {
    return this.status?.running || 0;
  }

  get taskCount(): number {
    return this.spec.tasks?.length || 0;
  }
}
