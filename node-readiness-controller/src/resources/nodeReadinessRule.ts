import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import type {
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

export class NodeReadinessRule extends BaseNodeReadinessRule {
  declare jsonData: NodeReadinessRuleObject;

  get spec(): NodeReadinessRuleSpec | undefined {
    return this.jsonData?.spec;
  }

  get status(): NodeReadinessRuleStatus | undefined {
    return this.jsonData?.status;
  }
}
