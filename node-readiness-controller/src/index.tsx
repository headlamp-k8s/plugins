import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { RuleDetails, RuleList } from './components/rules';
import { nrcRouteNames, nrcRoutePaths, nrcSidebarNames } from './utils';

export * from './components/rules';
export * from './resources';
export * from './utils';

// Rules list
registerRoute({
  path: nrcRoutePaths.rulesList,
  component: () => <RuleList />,
  exact: true,
  name: nrcRouteNames.rulesList,
  sidebar: nrcSidebarNames.rulesList,
});

// Rule details
registerRoute({
  path: nrcRoutePaths.ruleDetail,
  component: () => <RuleDetails />,
  exact: true,
  name: nrcRouteNames.ruleDetail,
  sidebar: nrcSidebarNames.rulesList,
});

// Parent entry in sidebar
registerSidebarEntry({
  name: nrcSidebarNames.root,
  label: 'Node Readiness',
  icon: 'mdi:shield-check',
  url: nrcRoutePaths.rulesList,
});

// Child entry in sidebar
registerSidebarEntry({
  parent: nrcSidebarNames.root,
  name: nrcSidebarNames.rulesList,
  label: 'Readiness Rules',
  url: nrcRoutePaths.rulesList,
});
