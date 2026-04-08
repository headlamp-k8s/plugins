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

/**
 * Headlamp resource class for the Kubeflow Pipeline CRD (pipelines.kubeflow.org/v2beta1).
 *
 * @see {@link https://www.kubeflow.org/docs/components/pipelines/ | Kubeflow Pipelines docs}
 */
export const PipelineClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: 'pipelines.kubeflow.org', version: 'v2beta1' }],
  isNamespaced: true,
  pluralName: 'pipelines',
  singularName: 'pipeline',
  kind: 'Pipeline',
});
