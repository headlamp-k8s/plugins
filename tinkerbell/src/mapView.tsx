import { Icon } from '@iconify/react';
import type {
  GraphEdge,
  GraphNode,
  GraphNodeStatus,
} from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import type { ComponentType } from 'react';
import { useMemo } from 'react';
import { BmcJobDetail } from './components/bmc/jobs/Detail';
import { BmcMachineDetail } from './components/bmc/machines/Detail';
import { BmcTaskDetail } from './components/bmc/tasks/Detail';
import type { TinkerbellDetailProps } from './components/common/detailTypes';
import { HardwareDetail } from './components/hardware/Detail';
import { TemplateDetail } from './components/templates/Detail';
import { WorkflowRuleSetDetail } from './components/workflowrulesets/Detail';
import { WorkflowDetail } from './components/workflows/Detail';
import { getWorkflowState } from './components/workflows/helpers';
import {
  getBmcJobRelationshipEdges,
  getBmcTaskRelationshipEdges,
  getHardwareBmcRelationshipEdges,
  getWorkflowRelationshipEdges,
  getWorkflowRuleSetRelationshipEdges,
} from './mapRelationships';
import { BmcJob } from './resources/bmcJob';
import { BmcMachine } from './resources/bmcMachine';
import { BmcTask } from './resources/bmcTask';
import { normalizeState } from './resources/common';
import { Hardware } from './resources/hardware';
import { Template } from './resources/template';
import { Workflow } from './resources/workflow';
import { WorkflowRuleSet } from './resources/workflowRuleSet';

const tinkerbellMapIcon = (
  <Icon icon="simple-icons:tinkerbell" width="100%" height="100%" color="rgb(50, 108, 229)" />
);

type TinkerbellMapKubeObject = {
  metadata: {
    uid: string;
    name?: string;
    namespace?: string;
  };
  cluster?: string;
  jsonData?: {
    metadata?: {
      name?: string;
      namespace?: string;
    };
  };
};

function makeMapDetailsComponent(Detail: ComponentType<TinkerbellDetailProps>) {
  return function TinkerbellMapDetails({ node }: { node: GraphNode }) {
    const kubeObject = node.kubeObject as TinkerbellMapKubeObject | undefined;
    const metadata = kubeObject?.metadata ?? kubeObject?.jsonData?.metadata ?? node.data;

    return (
      <Detail name={metadata?.name} namespace={metadata?.namespace} cluster={kubeObject?.cluster} />
    );
  };
}

const HardwareMapDetails = makeMapDetailsComponent(HardwareDetail);
const WorkflowMapDetails = makeMapDetailsComponent(WorkflowDetail);
const TemplateMapDetails = makeMapDetailsComponent(TemplateDetail);
const WorkflowRuleSetMapDetails = makeMapDetailsComponent(WorkflowRuleSetDetail);
const BmcMachineMapDetails = makeMapDetailsComponent(BmcMachineDetail);
const BmcJobMapDetails = makeMapDetailsComponent(BmcJobDetail);
const BmcTaskMapDetails = makeMapDetailsComponent(BmcTaskDetail);

function makeTinkerbellNode(
  kubeObject: TinkerbellMapKubeObject,
  subtitle: string,
  weight: number,
  detailsComponent: GraphNode['detailsComponent'],
  status?: GraphNodeStatus
): GraphNode {
  return {
    id: kubeObject.metadata.uid,
    kubeObject: kubeObject as GraphNode['kubeObject'],
    subtitle,
    weight,
    detailsComponent,
    status,
  };
}

function getConditionStatus(
  conditions: { type?: string; reason?: string; status?: string }[] | undefined
): GraphNodeStatus | undefined {
  const condition = conditions?.at(-1);
  const state = normalizeState(condition?.type ?? condition?.reason ?? condition?.status);

  if (['Failed', 'Error', 'Timeout'].includes(state)) {
    return 'error';
  }

  if (['Completed', 'Success', 'Ready', 'Contactable'].includes(state)) {
    return 'success';
  }

  if (['Running', 'Pending', 'Unknown'].includes(state)) {
    return 'warning';
  }

  return undefined;
}

function getWorkflowMapStatus(workflow: Workflow): GraphNodeStatus | undefined {
  const state = getWorkflowState(workflow);

  if (['Failed', 'Timeout'].includes(state)) {
    return 'error';
  }

  if (state === 'Success') {
    return 'success';
  }

  return undefined;
}

const hardwareSource = {
  id: 'tinkerbell-hardware',
  label: 'Hardware',
  icon: <Icon icon="mdi:server" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [hardware] = Hardware.useList();
    const [machines] = BmcMachine.useList();

    return useMemo(() => {
      if (!hardware) {
        return null;
      }

      return {
        nodes: hardware.map(item =>
          makeTinkerbellNode(item, 'Tinkerbell Hardware', 5000, HardwareMapDetails)
        ),
        edges: getHardwareBmcRelationshipEdges(hardware, machines),
      };
    }, [hardware, machines]);
  },
};

const workflowSource = {
  id: 'tinkerbell-workflows',
  label: 'Workflows',
  icon: (
    <Icon
      icon="mdi:transit-connection-variant"
      width="100%"
      height="100%"
      color="rgb(50, 108, 229)"
    />
  ),
  useData() {
    const [workflows] = Workflow.useList();
    const [hardware] = Hardware.useList();
    const [templates] = Template.useList();

    return useMemo(() => {
      if (!workflows) {
        return null;
      }

      return {
        nodes: workflows.map(item =>
          makeTinkerbellNode(
            item,
            'Tinkerbell Workflow',
            4000,
            WorkflowMapDetails,
            getWorkflowMapStatus(item)
          )
        ),
        edges: getWorkflowRelationshipEdges(workflows, hardware, templates),
      };
    }, [workflows, hardware, templates]);
  },
};

const templateSource = {
  id: 'tinkerbell-templates',
  label: 'Templates',
  icon: (
    <Icon icon="mdi:file-document-outline" width="100%" height="100%" color="rgb(50, 108, 229)" />
  ),
  useData() {
    const [templates] = Template.useList();

    return useMemo(() => {
      if (!templates) {
        return null;
      }

      return {
        nodes: templates.map(item =>
          makeTinkerbellNode(item, 'Tinkerbell Template', 3000, TemplateMapDetails)
        ),
      };
    }, [templates]);
  },
};

const workflowRuleSetSource = {
  id: 'tinkerbell-workflow-rulesets',
  label: 'WorkflowRuleSets',
  icon: <Icon icon="mdi:file-tree-outline" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [ruleSets] = WorkflowRuleSet.useList();
    const [templates] = Template.useList();

    return useMemo(() => {
      if (!ruleSets) {
        return null;
      }

      return {
        nodes: ruleSets.map(item =>
          makeTinkerbellNode(item, 'Tinkerbell WorkflowRuleSet', 2500, WorkflowRuleSetMapDetails)
        ),
        edges: getWorkflowRuleSetRelationshipEdges(ruleSets, templates),
      };
    }, [ruleSets, templates]);
  },
};

const bmcMachineSource = {
  id: 'tinkerbell-bmc-machines',
  label: 'BMC Machines',
  icon: <Icon icon="mdi:server-network" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [machines] = BmcMachine.useList();

    return useMemo(() => {
      if (!machines) {
        return null;
      }

      return {
        nodes: machines.map(item =>
          makeTinkerbellNode(
            item,
            'Tinkerbell BMC Machine',
            3500,
            BmcMachineMapDetails,
            getConditionStatus(item.status?.conditions)
          )
        ),
      };
    }, [machines]);
  },
};

const bmcJobSource = {
  id: 'tinkerbell-bmc-jobs',
  label: 'BMC Jobs',
  icon: (
    <Icon icon="mdi:clipboard-play-outline" width="100%" height="100%" color="rgb(50, 108, 229)" />
  ),
  useData() {
    const [jobs] = BmcJob.useList();
    const [machines] = BmcMachine.useList();

    return useMemo(() => {
      if (!jobs) {
        return null;
      }

      return {
        nodes: jobs.map(item =>
          makeTinkerbellNode(
            item,
            'Tinkerbell BMC Job',
            3000,
            BmcJobMapDetails,
            getConditionStatus(item.status?.conditions)
          )
        ),
        edges: getBmcJobRelationshipEdges(jobs, machines),
      };
    }, [jobs, machines]);
  },
};

const bmcTaskSource = {
  id: 'tinkerbell-bmc-tasks',
  label: 'BMC Tasks',
  icon: (
    <Icon icon="mdi:clipboard-check-outline" width="100%" height="100%" color="rgb(50, 108, 229)" />
  ),
  useData() {
    const [tasks] = BmcTask.useList();
    const [jobs] = BmcJob.useList();

    return useMemo(() => {
      if (!tasks) {
        return null;
      }

      return {
        nodes: tasks.map(item =>
          makeTinkerbellNode(
            item,
            'Tinkerbell BMC Task',
            2000,
            BmcTaskMapDetails,
            getConditionStatus(item.status?.conditions)
          )
        ),
        edges: getBmcTaskRelationshipEdges(tasks, jobs),
      };
    }, [tasks, jobs]);
  },
};

export const tinkerbellSource = {
  id: 'tinkerbell',
  label: 'Tinkerbell',
  icon: tinkerbellMapIcon,
  sources: [
    hardwareSource,
    workflowSource,
    templateSource,
    workflowRuleSetSource,
    bmcMachineSource,
    bmcJobSource,
    bmcTaskSource,
  ],
};
