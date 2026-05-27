/**
 * Copyright 2025 The Headlamp Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { addIcon } from '@iconify/react';
import {
  registerKubeObjectGlance,
  registerMapSource,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import { KatibExperimentsDetail } from './components/katib/KatibExperimentsDetail';
import { KatibExperimentsGlance } from './components/katib/KatibExperimentsGlance';
import { KatibExperimentsList } from './components/katib/KatibExperimentsList';
import { KatibOverview } from './components/katib/KatibOverview';
import { KatibSuggestionsDetail } from './components/katib/KatibSuggestionsDetail';
import { KatibSuggestionsList } from './components/katib/KatibSuggestionsList';
import { KatibTrialsDetail } from './components/katib/KatibTrialsDetail';
import { KatibTrialsList } from './components/katib/KatibTrialsList';
import { NotebooksDetail } from './components/notebooks/NotebooksDetail';
import { NotebooksGlance } from './components/notebooks/NotebooksGlance';
import { NotebooksList } from './components/notebooks/NotebooksList';
import { NotebooksOverview } from './components/notebooks/NotebooksOverview';
import { PodDefaultsDetail } from './components/notebooks/PodDefaultsDetail';
import { PodDefaultsGlance } from './components/notebooks/PodDefaultsGlance';
import { PodDefaultsList } from './components/notebooks/PodDefaultsList';
import { ProfilesDetail } from './components/notebooks/ProfilesDetail';
import { ProfilesGlance } from './components/notebooks/ProfilesGlance';
import { ProfilesList } from './components/notebooks/ProfilesList';
import { Overview } from './components/overview/Overview';
import { PipelineArtifacts } from './components/pipelines/PipelineArtifacts';
import { PipelineExperimentsDetail } from './components/pipelines/PipelineExperimentsDetail';
import { PipelineExperimentsList } from './components/pipelines/PipelineExperimentsList';
import { PipelineRecurringRunsDetail } from './components/pipelines/PipelineRecurringRunsDetail';
import { PipelineRecurringRunsList } from './components/pipelines/PipelineRecurringRunsList';
import { PipelineRunsDetail } from './components/pipelines/PipelineRunsDetail';
import { PipelineRunsList } from './components/pipelines/PipelineRunsList';
import { PipelinesDetail } from './components/pipelines/PipelinesDetail';
import { PipelinesGlance } from './components/pipelines/PipelinesGlance';
import { PipelinesList } from './components/pipelines/PipelinesList';
import { PipelinesOverview } from './components/pipelines/PipelinesOverview';
import { PipelineVersionsDetail } from './components/pipelines/PipelineVersionsDetail';
import { PipelineVersionsList } from './components/pipelines/PipelineVersionsList';
import { ScheduledSparkApplicationsDetail } from './components/spark/ScheduledSparkApplicationsDetail';
import { ScheduledSparkApplicationsList } from './components/spark/ScheduledSparkApplicationsList';
import { SparkApplicationsDetail } from './components/spark/SparkApplicationsDetail';
import { SparkApplicationsGlance } from './components/spark/SparkApplicationsGlance';
import { SparkApplicationsList } from './components/spark/SparkApplicationsList';
import { SparkOverview } from './components/spark/SparkOverview';
import { ClusterTrainingRuntimesList } from './components/training/ClusterTrainingRuntimesList';
import { TrainingOverview } from './components/training/TrainingOverview';
import {
  ClusterTrainingRuntimesDetail,
  TrainingRuntimesDetail,
} from './components/training/TrainingRuntimeDetails';
import { TrainingRuntimesList } from './components/training/TrainingRuntimesList';
import { TrainJobsDetail } from './components/training/TrainJobsDetail';
import { TrainJobsGlance } from './components/training/TrainJobsGlance';
import { TrainJobsList } from './components/training/TrainJobsList';
import { kubeflowApiSource } from './mapView';

addIcon('custom:kubeflow', {
  body: `<path fill="#4279f4" d="m35.59 43.66 2.836 70.645 51.027-65.121a4.716 4.716 0 0 1 3.164-1.774 4.705 4.705 0 0 1 3.48 1.004l31.829 25.547-10.38-45.395Zm0 0"/><path fill="#0028aa" d="M40.191 127.262h45.266l-27.793-22.297Zm0 0"/><path fill="#014bd1" d="M93.902 58.723 63.461 97.566l32.434 26.024 30.77-38.582Zm0 0"/><path fill="#bedcff" d="m27.055 36.848.004-.008 26.77-33.57L10.66 24.059 0 70.769Zm0 0"/><path fill="#6ca1ff" d="m.594 85.105 28.672 35.954-2.73-68.485Zm0 0"/><path fill="#a1c3ff" d="M109.215 20.54 67.937.66l-25.69 32.215Zm0 0"/>`,
  width: 128,
  height: 128,
});

registerSidebarEntry({
  parent: null,
  name: 'kubeflow',
  label: 'Kubeflow',
  url: '/kubeflow',
  icon: 'custom:kubeflow',
});

registerRoute({
  path: '/kubeflow',
  sidebar: 'kubeflow',
  name: 'kubeflow-dashboard',
  exact: true,
  component: () => <Overview />,
});

registerSidebarEntry({
  parent: 'kubeflow',
  name: 'kubeflow-notebooks',
  label: 'Notebooks',
  url: '/kubeflow/notebooks',
  icon: 'mdi:notebook',
});

registerRoute({
  path: '/kubeflow/notebooks',
  sidebar: 'kubeflow-notebooks',
  name: 'kubeflow-notebooks-overview',
  exact: true,
  component: () => <NotebooksOverview />,
});

registerSidebarEntry({
  parent: 'kubeflow-notebooks',
  name: 'kubeflow-notebooks-servers',
  label: 'Notebook Servers',
  url: '/kubeflow/notebooks/servers',
});
registerRoute({
  path: '/kubeflow/notebooks/servers',
  sidebar: 'kubeflow-notebooks-servers',
  name: 'kubeflow-notebooks-servers-list',
  exact: true,
  component: () => <NotebooksList />,
});
registerRoute({
  path: '/kubeflow/notebooks/servers/:namespace/:name',
  sidebar: 'kubeflow-notebooks-servers',
  name: 'kubeflow-notebooks-servers-detail',
  exact: true,
  component: () => <NotebooksDetail />,
});

registerSidebarEntry({
  parent: 'kubeflow-notebooks',
  name: 'kubeflow-notebooks-profiles',
  label: 'Profiles',
  url: '/kubeflow/notebooks/profiles',
});
registerRoute({
  path: '/kubeflow/notebooks/profiles',
  sidebar: 'kubeflow-notebooks-profiles',
  name: 'kubeflow-notebooks-profiles-list',
  exact: true,
  component: () => <ProfilesList />,
});
registerRoute({
  path: '/kubeflow/notebooks/profiles/:name',
  sidebar: 'kubeflow-notebooks-profiles',
  name: 'kubeflow-notebooks-profiles-detail',
  exact: true,
  component: () => <ProfilesDetail />,
});

registerSidebarEntry({
  parent: 'kubeflow-notebooks',
  name: 'kubeflow-notebooks-poddefaults',
  label: 'PodDefaults',
  url: '/kubeflow/notebooks/poddefaults',
});
registerRoute({
  path: '/kubeflow/notebooks/poddefaults',
  sidebar: 'kubeflow-notebooks-poddefaults',
  name: 'kubeflow-notebooks-poddefaults-list',
  exact: true,
  component: () => <PodDefaultsList />,
});
registerRoute({
  path: '/kubeflow/notebooks/poddefaults/:namespace/:name',
  sidebar: 'kubeflow-notebooks-poddefaults',
  name: 'kubeflow-notebooks-poddefaults-detail',
  exact: true,
  component: () => <PodDefaultsDetail />,
});

registerSidebarEntry({
  parent: 'kubeflow',
  name: 'kubeflow-pipelines',
  label: 'Pipelines',
  url: '/kubeflow/pipelines',
  icon: 'mdi:sitemap',
});
registerRoute({
  path: '/kubeflow/pipelines',
  sidebar: 'kubeflow-pipelines',
  name: 'kubeflow-pipelines-overview',
  exact: true,
  component: () => <PipelinesOverview />,
});

registerSidebarEntry({
  parent: 'kubeflow-pipelines',
  name: 'kubeflow-pipelines-list',
  label: 'Pipelines',
  url: '/kubeflow/pipelines/list',
});
registerRoute({
  path: '/kubeflow/pipelines/list',
  sidebar: 'kubeflow-pipelines-list',
  name: 'kubeflow-pipelines-list-view',
  exact: true,
  component: () => <PipelinesList />,
});
registerRoute({
  path: '/kubeflow/pipelines/list/:namespace/:name',
  sidebar: 'kubeflow-pipelines-list',
  name: 'kubeflow-pipelines-detail',
  exact: true,
  component: () => <PipelinesDetail />,
});

registerSidebarEntry({
  parent: 'kubeflow-pipelines',
  name: 'kubeflow-pipelines-versions',
  label: 'Pipeline Versions',
  url: '/kubeflow/pipelines/versions',
});
registerRoute({
  path: '/kubeflow/pipelines/versions',
  sidebar: 'kubeflow-pipelines-versions',
  name: 'kubeflow-pipeline-versions-list',
  exact: true,
  component: () => <PipelineVersionsList />,
});
registerRoute({
  path: '/kubeflow/pipelines/versions/:namespace/:name',
  sidebar: 'kubeflow-pipelines-versions',
  name: 'kubeflow-pipeline-versions-detail',
  exact: true,
  component: () => <PipelineVersionsDetail />,
});

registerSidebarEntry({
  parent: 'kubeflow-pipelines',
  name: 'kubeflow-pipelines-runs',
  label: 'Runs',
  url: '/kubeflow/pipelines/runs',
});
registerRoute({
  path: '/kubeflow/pipelines/runs',
  sidebar: 'kubeflow-pipelines-runs',
  name: 'kubeflow-pipeline-runs-list',
  exact: true,
  component: () => <PipelineRunsList />,
});
registerRoute({
  path: '/kubeflow/pipelines/runs/:namespace/:name',
  sidebar: 'kubeflow-pipelines-runs',
  name: 'kubeflow-pipeline-runs-detail',
  exact: true,
  component: () => <PipelineRunsDetail />,
});

registerSidebarEntry({
  parent: 'kubeflow-pipelines',
  name: 'kubeflow-pipelines-recurring',
  label: 'Recurring Runs',
  url: '/kubeflow/pipelines/recurring',
});
registerRoute({
  path: '/kubeflow/pipelines/recurring',
  sidebar: 'kubeflow-pipelines-recurring',
  name: 'kubeflow-pipeline-recurring-list',
  exact: true,
  component: () => <PipelineRecurringRunsList />,
});
registerRoute({
  path: '/kubeflow/pipelines/recurring/:namespace/:name',
  sidebar: 'kubeflow-pipelines-recurring',
  name: 'kubeflow-pipeline-recurring-detail',
  exact: true,
  component: () => <PipelineRecurringRunsDetail />,
});

registerSidebarEntry({
  parent: 'kubeflow-pipelines',
  name: 'kubeflow-pipelines-experiments',
  label: 'Experiments',
  url: '/kubeflow/pipelines/experiments',
});
registerRoute({
  path: '/kubeflow/pipelines/experiments',
  sidebar: 'kubeflow-pipelines-experiments',
  name: 'kubeflow-pipeline-experiments-list',
  exact: true,
  component: () => <PipelineExperimentsList />,
});
registerRoute({
  path: '/kubeflow/pipelines/experiments/:namespace/:name',
  sidebar: 'kubeflow-pipelines-experiments',
  name: 'kubeflow-pipeline-experiments-detail',
  exact: true,
  component: () => <PipelineExperimentsDetail />,
});

registerSidebarEntry({
  parent: 'kubeflow-pipelines',
  name: 'kubeflow-pipelines-artifacts',
  label: 'Artifacts',
  url: '/kubeflow/pipelines/artifacts',
});
registerRoute({
  path: '/kubeflow/pipelines/artifacts',
  sidebar: 'kubeflow-pipelines-artifacts',
  name: 'kubeflow-pipelines-artifacts',
  exact: true,
  component: () => <PipelineArtifacts />,
});

registerSidebarEntry({
  parent: 'kubeflow',
  name: 'kubeflow-katib',
  label: 'Katib',
  url: '/kubeflow/katib',
  icon: 'mdi:tune',
});
registerRoute({
  path: '/kubeflow/katib',
  sidebar: 'kubeflow-katib',
  name: 'kubeflow-katib-overview',
  exact: true,
  component: () => <KatibOverview />,
});
registerSidebarEntry({
  parent: 'kubeflow-katib',
  name: 'kubeflow-katib-experiments',
  label: 'Experiments',
  url: '/kubeflow/katib/experiments',
});
registerRoute({
  path: '/kubeflow/katib/experiments',
  sidebar: 'kubeflow-katib-experiments',
  name: 'kubeflow-katib-experiments-list',
  exact: true,
  component: () => <KatibExperimentsList />,
});
registerRoute({
  path: '/kubeflow/katib/experiments/:namespace/:name',
  sidebar: 'kubeflow-katib-experiments',
  name: 'kubeflow-katib-experiments-detail',
  exact: true,
  component: () => <KatibExperimentsDetail />,
});
registerSidebarEntry({
  parent: 'kubeflow-katib',
  name: 'kubeflow-katib-trials',
  label: 'Trials',
  url: '/kubeflow/katib/trials',
});
registerRoute({
  path: '/kubeflow/katib/trials',
  sidebar: 'kubeflow-katib-trials',
  name: 'kubeflow-katib-trials-list',
  exact: true,
  component: () => <KatibTrialsList />,
});
registerRoute({
  path: '/kubeflow/katib/trials/:namespace/:name',
  sidebar: 'kubeflow-katib-trials',
  name: 'kubeflow-katib-trials-detail',
  exact: true,
  component: () => <KatibTrialsDetail />,
});

registerSidebarEntry({
  parent: 'kubeflow-katib',
  name: 'kubeflow-katib-suggestions',
  label: 'Suggestions',
  url: '/kubeflow/katib/suggestions',
});
registerRoute({
  path: '/kubeflow/katib/suggestions',
  sidebar: 'kubeflow-katib-suggestions',
  name: 'kubeflow-katib-suggestions-list',
  exact: true,
  component: () => <KatibSuggestionsList />,
});
registerRoute({
  path: '/kubeflow/katib/suggestions/:namespace/:name',
  sidebar: 'kubeflow-katib-suggestions',
  name: 'kubeflow-katib-suggestions-detail',
  exact: true,
  component: () => <KatibSuggestionsDetail />,
});

registerSidebarEntry({
  parent: 'kubeflow',
  name: 'kubeflow-training',
  label: 'Training',
  url: '/kubeflow/training',
  icon: 'mdi:school',
});
registerRoute({
  path: '/kubeflow/training',
  sidebar: 'kubeflow-training',
  name: 'kubeflow-training-overview',
  exact: true,
  component: () => <TrainingOverview />,
});

registerSidebarEntry({
  parent: 'kubeflow-training',
  name: 'kubeflow-training-trainjobs',
  label: 'TrainJobs',
  url: '/kubeflow/training/trainjobs',
});
registerRoute({
  path: '/kubeflow/training/trainjobs',
  sidebar: 'kubeflow-training-trainjobs',
  name: 'kubeflow-training-trainjobs-list',
  exact: true,
  component: () => <TrainJobsList />,
});
registerRoute({
  path: '/kubeflow/training/trainjobs/:namespace/:name',
  sidebar: 'kubeflow-training-trainjobs',
  name: 'kubeflow-training-trainjobs-detail',
  exact: true,
  component: () => <TrainJobsDetail />,
});

registerSidebarEntry({
  parent: 'kubeflow-training',
  name: 'kubeflow-training-runtimes',
  label: 'TrainingRuntimes',
  url: '/kubeflow/training/trainingruntimes',
});
registerRoute({
  path: '/kubeflow/training/trainingruntimes',
  sidebar: 'kubeflow-training-runtimes',
  name: 'kubeflow-training-runtimes-list',
  exact: true,
  component: () => <TrainingRuntimesList />,
});
registerRoute({
  path: '/kubeflow/training/trainingruntimes/:namespace/:name',
  sidebar: 'kubeflow-training-runtimes',
  name: 'kubeflow-training-runtimes-detail',
  exact: true,
  component: () => <TrainingRuntimesDetail />,
});

registerSidebarEntry({
  parent: 'kubeflow-training',
  name: 'kubeflow-training-clusterruntimes',
  label: 'ClusterTrainingRuntimes',
  url: '/kubeflow/training/clustertrainingruntimes',
});
registerRoute({
  path: '/kubeflow/training/clustertrainingruntimes',
  sidebar: 'kubeflow-training-clusterruntimes',
  name: 'kubeflow-training-clusterruntimes-list',
  exact: true,
  component: () => <ClusterTrainingRuntimesList />,
});
registerRoute({
  path: '/kubeflow/training/clustertrainingruntimes/:name',
  sidebar: 'kubeflow-training-clusterruntimes',
  name: 'kubeflow-training-clusterruntimes-detail',
  exact: true,
  component: () => <ClusterTrainingRuntimesDetail />,
});

registerSidebarEntry({
  parent: 'kubeflow',
  name: 'kubeflow-spark',
  label: 'Spark',
  url: '/kubeflow/spark',
  icon: 'mdi:flash',
});

registerRoute({
  path: '/kubeflow/spark',
  sidebar: 'kubeflow-spark',
  name: 'kubeflow-spark-overview',
  exact: true,
  component: () => <SparkOverview />,
});

registerSidebarEntry({
  parent: 'kubeflow-spark',
  name: 'kubeflow-spark-applications',
  label: 'Spark Applications',
  url: '/kubeflow/spark/sparkapplications',
});

registerRoute({
  path: '/kubeflow/spark/sparkapplications',
  sidebar: 'kubeflow-spark-applications',
  name: 'kubeflow-spark-applications-list',
  exact: true,
  component: () => <SparkApplicationsList />,
});

registerRoute({
  path: '/kubeflow/spark/sparkapplications/:namespace/:name',
  sidebar: 'kubeflow-spark-applications',
  name: 'kubeflow-spark-applications-detail',
  exact: true,
  component: () => <SparkApplicationsDetail />,
});

registerSidebarEntry({
  parent: 'kubeflow-spark',
  name: 'kubeflow-spark-scheduled',
  label: 'Scheduled Spark Apps',
  url: '/kubeflow/spark/scheduledsparkapplications',
});

registerRoute({
  path: '/kubeflow/spark/scheduledsparkapplications',
  sidebar: 'kubeflow-spark-scheduled',
  name: 'kubeflow-spark-scheduled-list',
  exact: true,
  component: () => <ScheduledSparkApplicationsList />,
});

registerRoute({
  path: '/kubeflow/spark/scheduledsparkapplications/:namespace/:name',
  sidebar: 'kubeflow-spark-scheduled',
  name: 'kubeflow-spark-scheduled-detail',
  exact: true,
  component: () => <ScheduledSparkApplicationsDetail />,
});

// Register on-hover "glance" tooltips for kubeflow resource types
registerKubeObjectGlance({ id: 'notebook-glance', component: NotebooksGlance });
registerKubeObjectGlance({ id: 'profile-glance', component: ProfilesGlance });
registerKubeObjectGlance({ id: 'poddefault-glance', component: PodDefaultsGlance });
registerKubeObjectGlance({ id: 'katibexperiment-glance', component: KatibExperimentsGlance });
registerKubeObjectGlance({ id: 'pipeline-glance', component: PipelinesGlance });
registerKubeObjectGlance({ id: 'sparkapp-glance', component: SparkApplicationsGlance });
registerKubeObjectGlance({ id: 'trainjob-glance', component: TrainJobsGlance });

// Register the map source
registerMapSource(kubeflowApiSource);
