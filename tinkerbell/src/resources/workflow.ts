import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import {
  LocalObjectReference,
  TINKERBELL_API_VERSION,
  TinkerbellCondition,
  TinkerbellResource,
} from './common';

export const WORKFLOW_CRD_NAME = 'workflows.tinkerbell.org';

export interface WorkflowSpec {
  hardwareMap?: Record<string, string>;
  hardwareRef?: string | LocalObjectReference;
  templateRef?: string | LocalObjectReference;
}

export interface WorkflowActionStatus {
  name?: string;
  state?: string;
  message?: string;
  startedAt?: string;
  seconds?: number;
}

export interface WorkflowTaskStatus {
  name?: string;
  state?: string;
  actions?: WorkflowActionStatus[];
}

export interface WorkflowStatus {
  conditions?: TinkerbellCondition[];
  globalTimeout?: number;
  state?: string;
  tasks?: WorkflowTaskStatus[];
}

export interface TinkerbellWorkflow extends TinkerbellResource {
  spec?: WorkflowSpec;
  status?: WorkflowStatus;
}

export class Workflow extends KubeObject<TinkerbellWorkflow> {
  static readonly apiName = 'workflows';
  static readonly apiVersion = TINKERBELL_API_VERSION;
  static readonly crdName = WORKFLOW_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'Workflow';

  static get detailsRoute() {
    return '/tinkerbell/workflows/:namespace/:name';
  }

  get spec(): WorkflowSpec | undefined {
    return this.jsonData.spec;
  }

  get status(): WorkflowStatus | undefined {
    return this.jsonData.status;
  }

  get conditions(): TinkerbellCondition[] | undefined {
    return this.status?.conditions;
  }
}
