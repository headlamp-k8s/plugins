import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { TINKERBELL_API_VERSION, TinkerbellCondition, TinkerbellResource } from './common';

/** Fully qualified CRD name for Tinkerbell Workflow resources. */
export const WORKFLOW_CRD_NAME = 'workflows.tinkerbell.org';

/**
 * Boot options used by a provisioning workflow.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/tinkerbell.org_workflows.yaml
 */
export interface WorkflowBootOptions {
  /** Whether ISO boot is enabled. */
  isoboot?: boolean;

  /** Whether netboot is enabled. */
  netboot?: boolean;
}

/**
 * Desired workflow configuration.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/tinkerbell.org_workflows.yaml
 */
export interface WorkflowSpec {
  /** Boot options requested for the target machine. */
  bootOptions?: WorkflowBootOptions;

  /** Whether this workflow is disabled. */
  disabled?: boolean;

  /** Mapping of template hardware labels to concrete hardware values. */
  hardwareMap?: Record<string, string>;

  /** Name of the Hardware resource used by this workflow. */
  hardwareRef?: string;

  /** Name of the Template resource rendered by this workflow. */
  templateRef?: string;
}

/** Observed status for a single workflow action. */
export interface WorkflowActionStatus {
  /** Action name. */
  name?: string;

  /** Current action state. */
  state?: string;

  /** Human-readable action message. */
  message?: string;

  /** Action start timestamp. */
  startedAt?: string;

  /** Number of seconds spent executing this action. */
  seconds?: number;

  /** Raw fields from the workflow CRD status. */
  [key: string]: any;
}

/** Observed status for a workflow task. */
export interface WorkflowTaskStatus {
  /** Task name. */
  name?: string;

  /** Current task state. */
  state?: string;

  /** Actions inside this task. */
  actions?: WorkflowActionStatus[];

  /** Raw fields from the workflow CRD status. */
  [key: string]: any;
}

/** Observed status for a Tinkerbell Workflow object. */
export interface WorkflowStatus {
  /** Agent identifier executing this workflow. */
  agentID?: string;

  /** Effective boot options reported by the controller. */
  bootOptions?: WorkflowBootOptions;

  /** Condition list reported by Tinkerbell controllers. */
  conditions?: TinkerbellCondition[];

  /** Current state reported by the workflow engine. */
  currentState?: string;

  /** Whether a global execution stop has been requested. */
  globalExecutionStop?: boolean;

  /** Workflow timeout in seconds. */
  globalTimeout?: number;

  /** Overall workflow state. */
  state?: string;

  /** Task execution status for this workflow. */
  tasks?: WorkflowTaskStatus[];

  /** Template rendering status details. */
  templateRendering?: Record<string, any>;
}

/** Kubernetes object shape for a Tinkerbell Workflow resource. */
export interface TinkerbellWorkflow extends TinkerbellResource {
  /** Desired workflow configuration. */
  spec?: WorkflowSpec;

  /** Observed workflow status. */
  status?: WorkflowStatus;
}

/**
 * Headlamp resource model for Tinkerbell Workflow.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/tinkerbell.org_workflows.yaml
 */
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
