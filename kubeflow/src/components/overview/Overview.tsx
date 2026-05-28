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

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import { KatibExperimentClass } from '../../resources/katibExperiment';
import { NotebookClass } from '../../resources/notebook';
import { PipelineClass } from '../../resources/pipeline';
import { SparkApplicationClass } from '../../resources/sparkApplication';
import { TrainJobClass } from '../../resources/trainJob';
import { aggregateNotebookResources, describeResourceError } from '../common/notebookUtils';
import { OverviewContent, type OverviewModule } from './OverviewContent';

export function Overview() {
  const { t } = useTranslation();
  // Fetch lists directly from cluster
  const [notebooks, notebooksError] = NotebookClass.useList();
  const [pipelines, pipelinesError] = PipelineClass.useList();
  const [katibExps, katibError] = KatibExperimentClass.useList();
  const [trainJobs, trainError] = TrainJobClass.useList();
  const [sparkApps, sparkError] = SparkApplicationClass.useList();

  const isLoading =
    (notebooks === null && !notebooksError) ||
    (pipelines === null && !pipelinesError) ||
    (katibExps === null && !katibError) ||
    (trainJobs === null && !trainError) ||
    (sparkApps === null && !sparkError);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>{t('Loading Kubeflow Operator Dashboard...')}</Typography>
      </Box>
    );
  }

  const notebookResources = aggregateNotebookResources(notebooks || []);

  const modules: OverviewModule[] = [
    {
      title: t('Notebooks'),
      key: 'Notebook',
      icon: 'mdi:notebook',
      items: notebooks,
      isInstalled: notebooksError?.status !== 404,
      errorText: describeResourceError(notebooksError),
    },
    {
      title: t('Pipelines'),
      key: 'Pipeline',
      icon: 'mdi:sitemap',
      items: pipelines,
      isInstalled: pipelinesError?.status !== 404,
      errorText: describeResourceError(pipelinesError),
    },
    {
      title: t('Katib Experiments'),
      key: 'Katib',
      icon: 'mdi:tune',
      items: katibExps,
      isInstalled: katibError?.status !== 404,
      errorText: describeResourceError(katibError),
    },
    {
      title: t('Training Jobs'),
      key: 'Training',
      icon: 'mdi:school',
      items: trainJobs,
      isInstalled: trainError?.status !== 404,
      errorText: describeResourceError(trainError),
    },
    {
      title: t('Spark Applications'),
      key: 'Spark',
      icon: 'mdi:flash',
      items: sparkApps,
      isInstalled: sparkError?.status !== 404,
      errorText: describeResourceError(sparkError),
    },
  ];

  return (
    <OverviewContent
      modules={modules}
      extraCards={[
        {
          title: t('Notebook CPU Requested'),
          value: notebooksError
            ? describeResourceError(notebooksError) ?? t('Unavailable')
            : `${notebookResources.cpu.toFixed(1)}`,
          icon: 'mdi:cpu-64-bit',
          subtitle: notebooksError
            ? t('Notebook resource totals unavailable')
            : t('{{memory}} Gi memory, {{gpu}} GPUs requested', {
                memory: notebookResources.memory.toFixed(1),
                gpu: notebookResources.gpu,
              }),
        },
      ]}
    />
  );
}
