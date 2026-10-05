import { describe, expect, it } from 'vitest';
import {
  getBmcJobRelationshipEdges,
  getBmcTaskRelationshipEdges,
  getHardwareBmcRelationshipEdges,
  getWorkflowRelationshipEdges,
  getWorkflowRuleSetRelationshipEdges,
  getWorkflowRuleSetTemplateRef,
} from './mapRelationships';
import type { BmcJob } from './resources/bmcJob';
import type { BmcMachine } from './resources/bmcMachine';
import type { BmcTask } from './resources/bmcTask';
import type { Hardware } from './resources/hardware';
import type { Template } from './resources/template';
import type { Workflow } from './resources/workflow';
import type { WorkflowRuleSet } from './resources/workflowRuleSet';

function objectWithSpec<T>(uid: string, name: string, namespace: string, spec?: any): T {
  return {
    metadata: {
      uid,
      name,
      namespace,
    },
    spec,
  } as T;
}

describe('Tinkerbell map relationships', () => {
  it('connects workflows to referenced hardware and templates', () => {
    const hardware = [objectWithSpec<Hardware>('hardware-uid', 'machine1', 'tinkerbell')];
    const templates = [objectWithSpec<Template>('template-uid', 'ubuntu', 'tinkerbell')];
    const workflows = [
      objectWithSpec<Workflow>('workflow-uid', 'install', 'tinkerbell', {
        hardwareRef: 'machine1',
        templateRef: 'ubuntu',
      }),
    ];

    expect(getWorkflowRelationshipEdges(workflows, hardware, templates)).toEqual([
      {
        id: 'hardware-uid-workflow-uid',
        source: 'hardware-uid',
        target: 'workflow-uid',
        label: 'runs workflow',
      },
      {
        id: 'workflow-uid-template-uid',
        source: 'workflow-uid',
        target: 'template-uid',
        label: 'uses template',
      },
    ]);
  });

  it('connects hardware to its referenced BMC machine', () => {
    const hardware = [
      objectWithSpec<Hardware>('hardware-uid', 'machine1', 'tinkerbell', {
        bmcRef: {
          name: 'machine1-bmc',
          namespace: 'tinkerbell',
        },
      }),
    ];
    const machines = [objectWithSpec<BmcMachine>('machine-uid', 'machine1-bmc', 'tinkerbell')];

    expect(getHardwareBmcRelationshipEdges(hardware, machines)).toEqual([
      {
        id: 'hardware-uid-machine-uid',
        source: 'hardware-uid',
        target: 'machine-uid',
        label: 'uses BMC',
      },
    ]);
  });

  it('connects BMC jobs to referenced BMC machines', () => {
    const machines = [objectWithSpec<BmcMachine>('machine-uid', 'machine1-bmc', 'tinkerbell')];
    const jobs = [
      objectWithSpec<BmcJob>('job-uid', 'power-cycle', 'tinkerbell', {
        machineRef: {
          name: 'machine1-bmc',
          namespace: 'tinkerbell',
        },
      }),
    ];

    expect(getBmcJobRelationshipEdges(jobs, machines)).toEqual([
      {
        id: 'machine-uid-job-uid',
        source: 'machine-uid',
        target: 'job-uid',
        label: 'runs BMC job',
      },
    ]);
  });

  it('connects BMC tasks to owning BMC jobs', () => {
    const jobs = [objectWithSpec<BmcJob>('job-uid', 'power-cycle', 'tinkerbell')];
    const tasks = [
      {
        metadata: {
          uid: 'task-uid',
          name: 'power-cycle-task',
          namespace: 'tinkerbell',
          ownerReferences: [
            {
              kind: 'Job',
              name: 'power-cycle',
              uid: 'job-uid',
            },
          ],
        },
      } as BmcTask,
    ];

    expect(getBmcTaskRelationshipEdges(tasks, jobs)).toEqual([
      {
        id: 'job-uid-task-uid',
        source: 'job-uid',
        target: 'task-uid',
        label: 'creates task',
      },
    ]);
  });

  it('does not connect BMC tasks to recreated jobs with the same name', () => {
    const jobs = [objectWithSpec<BmcJob>('new-job-uid', 'power-cycle', 'tinkerbell')];
    const tasks = [
      {
        metadata: {
          uid: 'task-uid',
          name: 'power-cycle-task',
          namespace: 'tinkerbell',
          ownerReferences: [
            {
              kind: 'Job',
              name: 'power-cycle',
              uid: 'old-job-uid',
            },
          ],
        },
      } as BmcTask,
    ];

    expect(getBmcTaskRelationshipEdges(tasks, jobs)).toEqual([]);
  });

  it('connects WorkflowRuleSets to referenced templates', () => {
    const templates = [objectWithSpec<Template>('template-uid', 'ubuntu', 'tinkerbell')];
    const ruleSets = [
      objectWithSpec<WorkflowRuleSet>('ruleset-uid', 'rules', 'tinkerbell', {
        workflow: {
          template: {
            ref: 'ubuntu',
          },
        },
      }),
    ];

    expect(getWorkflowRuleSetTemplateRef(ruleSets[0])).toBe('ubuntu');
    expect(getWorkflowRuleSetRelationshipEdges(ruleSets, templates)).toEqual([
      {
        id: 'ruleset-uid-template-uid',
        source: 'ruleset-uid',
        target: 'template-uid',
        label: 'uses template',
      },
    ]);
  });

  it('connects WorkflowRuleSets to templates in the configured workflow namespace', () => {
    const templates = [objectWithSpec<Template>('template-uid', 'ubuntu', 'workflows')];
    const ruleSets = [
      objectWithSpec<WorkflowRuleSet>('ruleset-uid', 'rules', 'tinkerbell', {
        workflow: {
          namespace: 'workflows',
          templateRef: 'ubuntu',
        },
      }),
    ];

    expect(getWorkflowRuleSetRelationshipEdges(ruleSets, templates)).toEqual([
      {
        id: 'ruleset-uid-template-uid',
        source: 'ruleset-uid',
        target: 'template-uid',
        label: 'uses template',
      },
    ]);
  });

  it('skips missing references instead of creating guessed edges', () => {
    const workflows = [
      objectWithSpec<Workflow>('workflow-uid', 'install', 'tinkerbell', {
        hardwareRef: 'missing-hardware',
        templateRef: 'missing-template',
      }),
    ];

    expect(getWorkflowRelationshipEdges(workflows, [], [])).toEqual([]);
  });
});
