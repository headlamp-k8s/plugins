import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { nrcRouteNames } from '../utils/routes';
import type {
  ConditionPolicy,
  EnforcementMode,
  NodeReadinessRuleObject,
  NodeReadinessRuleSpec,
  NodeReadinessRuleStatus,
} from './types';

const BaseNodeReadinessRule = makeCustomResourceClass({
  apiInfo: [{ group: 'readiness.node.x-k8s.io', version: 'v1alpha1' }],
  isNamespaced: false,
  kind: 'NodeReadinessRule',
  singularName: 'NodeReadinessRule',
  pluralName: 'nodereadinessrules',
});

/**
 * Headlamp KubeObject class representing a NodeReadinessRule custom resource.
 * Encapsulates cluster-scoped readiness rule data, schema defaults, and status helpers.
 */
export class NodeReadinessRule extends BaseNodeReadinessRule {
  declare jsonData: NodeReadinessRuleObject;

  /**
   * Route name registered in Headlamp for navigating to this resource's detail view.
   */
  static get detailsRoute(): string {
    return nrcRouteNames.ruleDetail;
  }

  /**
   * Typed getter for the rule's desired specification.
   */
  get spec(): NodeReadinessRuleSpec {
    return this.jsonData?.spec;
  }

  /**
   * Typed getter for the rule's observed controller status.
   */
  get status(): NodeReadinessRuleStatus | undefined {
    return this.jsonData?.status;
  }

  /**
   * Boolean indicating whether this rule is operating in dry-run simulation mode.
   */
  get isDryRun(): boolean {
    return Boolean(this.spec?.dryRun);
  }

  /**
   * Lifecycle enforcement mode for this rule ('bootstrap-only' or 'continuous').
   * Defaults to 'continuous' if unspecified.
   */
  get enforcementMode(): EnforcementMode {
    return this.spec?.enforcementMode || 'continuous';
  }

  /**
   * Condition evaluation policy for this rule ('allOf' or 'anyOf').
   * Defaults to 'allOf' if unspecified.
   */
  get conditionPolicy(): ConditionPolicy {
    return this.spec?.conditionPolicy || 'allOf';
  }
}
