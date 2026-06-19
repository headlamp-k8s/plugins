/*
 * Copyright 2026 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { addIcon, Icon } from '@iconify/react';
import {
  registerKindIcon,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import { BmcJobList } from './components/bmc/jobs/List';
import { BmcMachineList } from './components/bmc/machines/List';
import { BmcTaskList } from './components/bmc/tasks/List';
import { TinkerbellRouteWrapper } from './components/common/TinkerbellRouteWrapper';
import { CrdList } from './components/crds/List';
import { HardwareList } from './components/hardware/List';
import { TemplateList } from './components/templates/List';
import { WorkflowRuleSetList } from './components/workflowrulesets/List';
import { WorkflowList } from './components/workflows/List';
import { BmcJob } from './resources/bmcJob';
import { BmcMachine } from './resources/bmcMachine';
import { BmcTask } from './resources/bmcTask';
import { TINKERBELL_API_GROUP, TINKERBELL_BMC_API_GROUP } from './resources/common';
import { Hardware } from './resources/hardware';
import { Template } from './resources/template';
import { Workflow } from './resources/workflow';
import { WorkflowRuleSet } from './resources/workflowRuleSet';

addIcon('simple-icons:tinkerbell', {
  body: '<path fill="currentColor" d="M12 2a3 3 0 0 1 2.95 2.46l.12.66 4.87 2.81a2 2 0 0 1 .73 2.73l-1.26 2.18.5 2.83a2 2 0 0 1-1.63 2.31l-2.8.5-1.44 2.5a2 2 0 0 1-3.46 0l-1.44-2.5-2.8-.5a2 2 0 0 1-1.63-2.31l.5-2.83-1.26-2.18a2 2 0 0 1 .73-2.73l4.87-2.81.12-.66A3 3 0 0 1 12 2Zm0 2a1 1 0 0 0-.98.82l-.28 1.52-5.06 2.92 1.31 2.27-.55 3.1 3.08.55L11.27 18a.85.85 0 0 0 1.46 0l1.75-2.82 3.08-.55-.55-3.1 1.31-2.27-5.06-2.92-.28-1.52A1 1 0 0 0 12 4Zm0 4.5 1.06 2.15 2.37.34-1.72 1.68.41 2.36L12 13.92l-2.12 1.11.41-2.36-1.72-1.68 2.37-.34L12 8.5Z" />',
  width: 24,
  height: 24,
});

registerSidebarEntry({
  parent: null,
  name: 'tinkerbell',
  icon: 'simple-icons:tinkerbell',
  label: 'Tinkerbell',
  url: '/tinkerbell/hardware',
});

registerSidebarEntry({
  parent: 'tinkerbell',
  name: 'tinkerbell-hardware',
  label: 'Hardware',
  url: '/tinkerbell/hardware',
});

registerRoute({
  path: '/tinkerbell/hardware',
  sidebar: 'tinkerbell-hardware',
  component: () => (
    <TinkerbellRouteWrapper requiredCrds={[Hardware.crdName]}>
      <HardwareList />
    </TinkerbellRouteWrapper>
  ),
  exact: true,
  name: 'tinkerbell-hardware',
});

registerSidebarEntry({
  parent: 'tinkerbell',
  name: 'tinkerbell-templates',
  label: 'Templates',
  url: '/tinkerbell/templates',
});

registerRoute({
  path: '/tinkerbell/templates',
  sidebar: 'tinkerbell-templates',
  component: () => (
    <TinkerbellRouteWrapper requiredCrds={[Template.crdName]}>
      <TemplateList />
    </TinkerbellRouteWrapper>
  ),
  exact: true,
  name: 'tinkerbell-templates',
});

registerSidebarEntry({
  parent: 'tinkerbell',
  name: 'tinkerbell-workflows',
  label: 'Workflows',
  url: '/tinkerbell/workflows',
});

registerRoute({
  path: '/tinkerbell/workflows',
  sidebar: 'tinkerbell-workflows',
  component: () => (
    <TinkerbellRouteWrapper requiredCrds={[Workflow.crdName]}>
      <WorkflowList />
    </TinkerbellRouteWrapper>
  ),
  exact: true,
  name: 'tinkerbell-workflows',
});

registerSidebarEntry({
  parent: 'tinkerbell',
  name: 'tinkerbell-workflow-rulesets',
  label: 'WorkflowRuleSets',
  url: '/tinkerbell/workflows/rulesets',
});

registerRoute({
  path: '/tinkerbell/workflows/rulesets',
  sidebar: 'tinkerbell-workflow-rulesets',
  component: () => (
    <TinkerbellRouteWrapper requiredCrds={[WorkflowRuleSet.crdName]}>
      <WorkflowRuleSetList />
    </TinkerbellRouteWrapper>
  ),
  exact: true,
  name: 'tinkerbell-workflow-rulesets',
});

registerSidebarEntry({
  parent: 'tinkerbell',
  name: 'tinkerbell-bmc',
  label: 'BMC',
  url: '/tinkerbell/bmc/machines',
});

registerSidebarEntry({
  parent: 'tinkerbell-bmc',
  name: 'tinkerbell-bmc-machines',
  label: 'Machines',
  url: '/tinkerbell/bmc/machines',
});

registerRoute({
  path: '/tinkerbell/bmc/machines',
  sidebar: 'tinkerbell-bmc-machines',
  component: () => (
    <TinkerbellRouteWrapper requiredCrds={[BmcMachine.crdName]}>
      <BmcMachineList />
    </TinkerbellRouteWrapper>
  ),
  exact: true,
  name: 'tinkerbell-bmc-machines',
});

registerSidebarEntry({
  parent: 'tinkerbell-bmc',
  name: 'tinkerbell-bmc-jobs',
  label: 'Jobs',
  url: '/tinkerbell/bmc/jobs',
});

registerRoute({
  path: '/tinkerbell/bmc/jobs',
  sidebar: 'tinkerbell-bmc-jobs',
  component: () => (
    <TinkerbellRouteWrapper requiredCrds={[BmcJob.crdName]}>
      <BmcJobList />
    </TinkerbellRouteWrapper>
  ),
  exact: true,
  name: 'tinkerbell-bmc-jobs',
});

registerSidebarEntry({
  parent: 'tinkerbell-bmc',
  name: 'tinkerbell-bmc-tasks',
  label: 'Tasks',
  url: '/tinkerbell/bmc/tasks',
});

registerRoute({
  path: '/tinkerbell/bmc/tasks',
  sidebar: 'tinkerbell-bmc-tasks',
  component: () => (
    <TinkerbellRouteWrapper requiredCrds={[BmcTask.crdName]}>
      <BmcTaskList />
    </TinkerbellRouteWrapper>
  ),
  exact: true,
  name: 'tinkerbell-bmc-tasks',
});

registerSidebarEntry({
  parent: 'tinkerbell',
  name: 'tinkerbell-crds',
  label: 'CRDs',
  url: '/tinkerbell/crds',
});

registerRoute({
  path: '/tinkerbell/crds',
  sidebar: 'tinkerbell-crds',
  component: () => <CrdList />,
  exact: true,
  name: 'tinkerbell-crds',
});

const coreTinkerbellKindIcon = {
  icon: <Icon icon="mdi:server" width="70%" height="70%" />,
  color: 'rgb(50, 108, 229)',
};

registerKindIcon('Hardware', coreTinkerbellKindIcon, TINKERBELL_API_GROUP);

registerKindIcon(
  'Workflow',
  {
    icon: <Icon icon="mdi:transit-connection-variant" width="70%" height="70%" />,
    color: 'rgb(50, 108, 229)',
  },
  TINKERBELL_API_GROUP
);

registerKindIcon(
  'Template',
  {
    icon: <Icon icon="mdi:file-document-outline" width="70%" height="70%" />,
    color: 'rgb(50, 108, 229)',
  },
  TINKERBELL_API_GROUP
);

registerKindIcon(
  'WorkflowRuleSet',
  {
    icon: <Icon icon="mdi:file-tree-outline" width="70%" height="70%" />,
    color: 'rgb(50, 108, 229)',
  },
  TINKERBELL_API_GROUP
);

registerKindIcon(
  'Machine',
  {
    icon: <Icon icon="mdi:server-network" width="70%" height="70%" />,
    color: 'rgb(50, 108, 229)',
  },
  TINKERBELL_BMC_API_GROUP
);

registerKindIcon(
  'Job',
  {
    icon: <Icon icon="mdi:clipboard-play-outline" width="70%" height="70%" />,
    color: 'rgb(50, 108, 229)',
  },
  TINKERBELL_BMC_API_GROUP
);

registerKindIcon(
  'Task',
  {
    icon: <Icon icon="mdi:clipboard-check-outline" width="70%" height="70%" />,
    color: 'rgb(50, 108, 229)',
  },
  TINKERBELL_BMC_API_GROUP
);
