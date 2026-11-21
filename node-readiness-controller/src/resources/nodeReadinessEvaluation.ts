import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { nrcRouteNames } from '../utils/routes';
import type {
  NodeEvaluationState,
  NodeReadinessEvaluationObject,
  NodeReadinessEvaluationSpec,
  NodeReadinessEvaluationStatus,
  RuleEvaluation,
} from './types';

const BaseNodeReadinessEvaluation = makeCustomResourceClass({
  apiInfo: [{ group: 'readiness.node.x-k8s.io', version: 'v1alpha1' }],
  isNamespaced: false,
  kind: 'NodeReadinessEvaluation',
  singularName: 'nodereadinessevaluation',
  pluralName: 'nodereadinessevaluations',
});

/**
 * Headlamp KubeObject class representing a NodeReadinessEvaluation custom resource.
 * Maps 1:1 to a Kubernetes Node and provides granular evaluation results for all applicable rules.
 */
export class NodeReadinessEvaluation extends BaseNodeReadinessEvaluation {
  declare jsonData: NodeReadinessEvaluationObject;

  /**
   * Route name registered in Headlamp for navigating to this resource's detail view.
   */
  static get detailsRoute(): string {
    return nrcRouteNames.evaluationDetail;
  }

  /**
   * Typed getter for the evaluation's desired specification.
   */
  get spec(): NodeReadinessEvaluationSpec {
    return this.jsonData?.spec;
  }

  /**
   * Name of the target node evaluated by this resource.
   */
  get nodeName(): string {
    return this.spec?.nodeName || this.metadata?.name || '';
  }

  /**
   * Typed getter for the observed controller status.
   */
  get status(): NodeReadinessEvaluationStatus | undefined {
    return this.jsonData?.status;
  }

  /**
   * Overall node readiness availability state ('Available', 'NotAvailable', or undefined).
   */
  get state(): NodeEvaluationState | undefined {
    return this.status?.state;
  }

  /**
   * Array of rule evaluations recorded for this node.
   */
  get rules(): RuleEvaluation[] {
    return this.status?.rules ?? [];
  }
}
