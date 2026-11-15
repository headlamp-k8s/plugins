import type { GraphEdge } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import type { BmcJob } from './resources/bmcJob';
import type { BmcMachine } from './resources/bmcMachine';
import type { BmcTask } from './resources/bmcTask';
import type { Hardware } from './resources/hardware';
import type { Template } from './resources/template';
import type { Workflow } from './resources/workflow';
import type { WorkflowRuleSet } from './resources/workflowRuleSet';

type TinkerbellMapObject = {
  metadata: {
    uid: string;
    name: string;
    namespace?: string;
    ownerReferences?: {
      apiVersion?: string;
      kind?: string;
      name?: string;
      uid?: string;
    }[];
  };
};

/**
 * Builds a graph edge between two Kubernetes objects.
 *
 * @param from - Source object for the relationship.
 * @param to - Target object for the relationship.
 * @param label - Optional relationship label shown by the map.
 * @returns Graph edge connecting the two objects.
 */
export function makeTinkerbellEdge(
  from: TinkerbellMapObject,
  to: TinkerbellMapObject,
  label?: string
): GraphEdge {
  return {
    id: `${from.metadata.uid}-${to.metadata.uid}`,
    source: from.metadata.uid,
    target: to.metadata.uid,
    label,
  };
}

function findByNameAndNamespace<T extends TinkerbellMapObject>(
  items: T[] | null | undefined,
  name: string | undefined,
  namespace: string | undefined
): T | undefined {
  if (!name || !items) {
    return undefined;
  }

  return items.find(
    item =>
      item.metadata.name === name &&
      (!namespace || !item.metadata.namespace || item.metadata.namespace === namespace)
  );
}

/**
 * Gets the template reference from a WorkflowRuleSet workflow config.
 *
 * @param item - WorkflowRuleSet resource to inspect.
 * @returns Template reference/name when present.
 */
export function getWorkflowRuleSetTemplateRef(item: WorkflowRuleSet): string | undefined {
  const workflow = item.spec?.workflow;
  const template = workflow?.template ?? workflow?.templateRef ?? workflow?.ref;

  if (typeof template === 'string') {
    return template;
  }

  return template?.ref ?? template?.name ?? workflow?.templateName;
}

/**
 * Builds Hardware -> Workflow and Workflow -> Template edges.
 *
 * @param workflows - Tinkerbell Workflow resources.
 * @param hardware - Tinkerbell Hardware resources.
 * @param templates - Tinkerbell Template resources.
 * @returns Relationship edges for workflows.
 */
export function getWorkflowRelationshipEdges(
  workflows: Workflow[] | null | undefined,
  hardware: Hardware[] | null | undefined,
  templates: Template[] | null | undefined
): GraphEdge[] {
  const edges: GraphEdge[] = [];

  workflows?.forEach(workflow => {
    const namespace = workflow.metadata.namespace;
    const relatedHardware = findByNameAndNamespace(hardware, workflow.spec?.hardwareRef, namespace);
    const relatedTemplate = findByNameAndNamespace(
      templates,
      workflow.spec?.templateRef,
      namespace
    );

    if (relatedHardware) {
      edges.push(makeTinkerbellEdge(relatedHardware, workflow, 'runs workflow'));
    }

    if (relatedTemplate) {
      edges.push(makeTinkerbellEdge(workflow, relatedTemplate, 'uses template'));
    }
  });

  return edges;
}

/**
 * Builds Hardware -> BMC Machine edges from Hardware bmcRef values.
 *
 * @param hardware - Tinkerbell Hardware resources.
 * @param machines - Tinkerbell BMC Machine resources.
 * @returns Relationship edges for BMC-backed hardware.
 */
export function getHardwareBmcRelationshipEdges(
  hardware: Hardware[] | null | undefined,
  machines: BmcMachine[] | null | undefined
): GraphEdge[] {
  const edges: GraphEdge[] = [];

  hardware?.forEach(item => {
    const bmcRef = item.spec?.bmcRef;
    const machine = findByNameAndNamespace(
      machines,
      bmcRef?.name,
      bmcRef?.namespace ?? item.metadata.namespace
    );

    if (machine) {
      edges.push(makeTinkerbellEdge(item, machine, 'uses BMC'));
    }
  });

  return edges;
}

/**
 * Builds BMC Machine -> BMC Job edges from Job machineRef values.
 *
 * @param jobs - Tinkerbell BMC Job resources.
 * @param machines - Tinkerbell BMC Machine resources.
 * @returns Relationship edges for BMC jobs.
 */
export function getBmcJobRelationshipEdges(
  jobs: BmcJob[] | null | undefined,
  machines: BmcMachine[] | null | undefined
): GraphEdge[] {
  const edges: GraphEdge[] = [];

  jobs?.forEach(job => {
    const machine = findByNameAndNamespace(
      machines,
      job.spec?.machineRef?.name,
      job.spec?.machineRef?.namespace ?? job.metadata.namespace
    );

    if (machine) {
      edges.push(makeTinkerbellEdge(machine, job, 'runs BMC job'));
    }
  });

  return edges;
}

/**
 * Builds BMC Job -> BMC Task edges from Task ownerReferences.
 *
 * @param tasks - Tinkerbell BMC Task resources.
 * @param jobs - Tinkerbell BMC Job resources.
 * @returns Relationship edges for BMC task ownership.
 */
export function getBmcTaskRelationshipEdges(
  tasks: BmcTask[] | null | undefined,
  jobs: BmcJob[] | null | undefined
): GraphEdge[] {
  const edges: GraphEdge[] = [];

  tasks?.forEach(task => {
    const ownerRefs = task.metadata.ownerReferences ?? [];
    const job = jobs?.find(candidate =>
      ownerRefs.some(owner => owner.kind === 'Job' && owner.uid === candidate.metadata.uid)
    );

    if (job) {
      edges.push(makeTinkerbellEdge(job, task, 'creates task'));
    }
  });

  return edges;
}

/**
 * Builds WorkflowRuleSet -> Template edges from workflow template references.
 *
 * @param ruleSets - Tinkerbell WorkflowRuleSet resources.
 * @param templates - Tinkerbell Template resources.
 * @returns Relationship edges for workflow rule sets.
 */
export function getWorkflowRuleSetRelationshipEdges(
  ruleSets: WorkflowRuleSet[] | null | undefined,
  templates: Template[] | null | undefined
): GraphEdge[] {
  const edges: GraphEdge[] = [];

  ruleSets?.forEach(ruleSet => {
    const template = findByNameAndNamespace(
      templates,
      getWorkflowRuleSetTemplateRef(ruleSet),
      ruleSet.spec?.workflow?.namespace ?? ruleSet.metadata.namespace
    );

    if (template) {
      edges.push(makeTinkerbellEdge(ruleSet, template, 'uses template'));
    }
  });

  return edges;
}
