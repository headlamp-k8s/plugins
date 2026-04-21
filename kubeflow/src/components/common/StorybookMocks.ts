/**
 * Global mocks for Storybook.
 * Intercepts Headlamp SDK calls and Kubeflow capability checks
 * to provide mock data without cluster access.
 */

import { NotebookClass } from '../../resources/notebook';
import { PipelineClass } from '../../resources/pipeline';
import { PipelineExperimentClass } from '../../resources/pipelineExperiment';
import { PipelineRecurringRunClass } from '../../resources/pipelineRecurringRun';
import { PipelineRunClass } from '../../resources/pipelineRun';
import { PipelineVersionClass } from '../../resources/pipelineVersion';
import { PodDefaultClass } from '../../resources/podDefault';
import { ProfileClass } from '../../resources/profile';
import { allNotebooks, allPodDefaults, allProfiles } from '../notebooks/__fixtures__/mockData';
import {
  allExperiments,
  allPipelines,
  allRecurringRuns,
  allRuns,
  allVersions,
} from '../pipelines/__fixtures__/mockData';

// 1. Set global mock flag for hooks to detect Storybook environment
(window as any).HEADLAMP_KUBEFLOW_STORYBOOK_MOCK = true;

// 2. Mock useList for all relevant resource classes
const mockMappings: Record<string, any[]> = {
  Pipeline: allPipelines,
  PipelineVersion: allVersions,
  Run: allRuns,
  RecurringRun: allRecurringRuns,
  Experiment: allExperiments,
  Notebook: allNotebooks,
  PodDefault: allPodDefaults,
  Profile: allProfiles,
};

// Reusable mock hook
function createUseListMock(cls: any, items: any[]) {
  return function () {
    const instances = items.map(item => new cls(item));
    return [instances, null];
  };
}

// Reusable mock get hook
function createUseGetMock(cls: any, items: any[]) {
  return function (name: string, namespace?: string) {
    const item = items.find(
      i => i.metadata.name === name && (!namespace || i.metadata.namespace === namespace)
    );
    return [item ? new cls(item) : null, null];
  };
}

// Patch the classes
[
  { cls: PipelineClass, name: 'Pipeline' },
  { cls: PipelineVersionClass, name: 'PipelineVersion' },
  { cls: PipelineRunClass, name: 'Run' },
  { cls: PipelineRecurringRunClass, name: 'RecurringRun' },
  { cls: PipelineExperimentClass, name: 'Experiment' },
  { cls: NotebookClass, name: 'Notebook' },
  { cls: PodDefaultClass, name: 'PodDefault' },
  { cls: ProfileClass, name: 'Profile' },
].forEach(({ cls, name }) => {
  const mockData = mockMappings[name] || [];
  (cls as any).useList = createUseListMock(cls, mockData);
  (cls as any).useGet = createUseGetMock(cls, mockData);
});
