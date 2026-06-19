import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { TINKERBELL_API_VERSION, TinkerbellResource } from './common';

/** Fully qualified CRD name for Tinkerbell WorkflowRuleSet resources. */
export const WORKFLOW_RULE_SET_CRD_NAME = 'workflowrulesets.tinkerbell.org';

/**
 * Rule entry that can create or update workflows.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/tinkerbell.org_workflowrulesets.yaml
 */
export interface WorkflowRuleSetRule {
  /** Rule name. */
  name?: string;

  /** Raw rule fields defined by the CRD. */
  [key: string]: any;
}

/**
 * Desired workflow rule set configuration.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/tinkerbell.org_workflowrulesets.yaml
 */
export interface WorkflowRuleSetSpec {
  /** Rules evaluated for workflow automation. */
  rules?: WorkflowRuleSetRule[];

  /** Workflow template or workflow reference data used by the rules. */
  workflow?: Record<string, any>;
}

/** Kubernetes object shape for a Tinkerbell WorkflowRuleSet resource. */
export interface TinkerbellWorkflowRuleSet extends TinkerbellResource {
  /** Desired workflow rule set configuration. */
  spec?: WorkflowRuleSetSpec;
}

/**
 * Headlamp resource model for Tinkerbell WorkflowRuleSet.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/tinkerbell.org_workflowrulesets.yaml
 */
export class WorkflowRuleSet extends KubeObject<TinkerbellWorkflowRuleSet> {
  static readonly apiName = 'workflowrulesets';
  static readonly apiVersion = TINKERBELL_API_VERSION;
  static readonly crdName = WORKFLOW_RULE_SET_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'WorkflowRuleSet';

  static get detailsRoute() {
    return '/tinkerbell/workflows/rulesets/:namespace/:name';
  }

  get spec(): WorkflowRuleSetSpec | undefined {
    return this.jsonData.spec;
  }
}
