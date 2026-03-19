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

import { K8s } from '@kinvolk/headlamp-plugin/lib';

export const NotebookClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: 'kubeflow.org', version: 'v1' }],
  isNamespaced: true,
  pluralName: 'notebooks',
  singularName: 'notebook',
  kind: 'Notebook',
});

export const PipelineClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: 'pipelines.kubeflow.org', version: 'v2beta1' }],
  isNamespaced: true,
  pluralName: 'pipelines',
  singularName: 'pipeline',
  kind: 'Pipeline',
});

export const KatibExperimentClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: 'kubeflow.org', version: 'v1beta1' }],
  isNamespaced: true,
  pluralName: 'experiments',
  singularName: 'experiment',
  kind: 'Experiment',
});

export const TrainJobClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: 'trainer.kubeflow.org', version: 'v1alpha1' }],
  isNamespaced: true,
  pluralName: 'trainjobs',
  singularName: 'trainjob',
  kind: 'TrainJob',
});

export const SparkApplicationClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: 'sparkoperator.k8s.io', version: 'v1beta2' }],
  isNamespaced: true,
  pluralName: 'sparkapplications',
  singularName: 'sparkapplication',
  kind: 'SparkApplication',
});
