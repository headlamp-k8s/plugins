import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import NodeReadinessRuleDetails from './NodeReadinessRuleDetails';
import ReadinessRulesPage from './NodeReadinessRuleList';
import type {
  NodeReadinessRuleObject,
  NodeReadinessRuleSpec,
  NodeReadinessRuleStatus,
} from './types';

export * from './types';

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

// For implement-nrc-ui (Milestone 2), the list page is the main entry point
registerRoute({
  path: '/nrc/rules',
  component: () => <ReadinessRulesPage />,
  exact: true,
  name: 'Readiness Rules',
  sidebar: 'nrc-rules-list',
});

registerRoute({
  path: '/nrc/rules/:name',
  component: () => <NodeReadinessRuleDetails />,
  exact: true,
  name: 'nrc-rule-details',
  sidebar: 'nrc-rules-list',
});

registerSidebarEntry({
  name: 'nrc-plugin',
  label: 'Node Readiness',
  icon: 'mdi:shield-check',
  url: '/nrc/rules',
});

registerSidebarEntry({
  parent: 'nrc-plugin',
  name: 'nrc-rules-list',
  label: 'Readiness Rules',
  url: '/nrc/rules',
});
