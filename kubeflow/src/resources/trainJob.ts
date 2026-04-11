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
 * Headlamp resource class for the Kubeflow TrainJob CRD (trainer.kubeflow.org/v1alpha1).
 *
 * @see {@link https://www.kubeflow.org/docs/components/training/ | Kubeflow Training docs}
 */
export const TrainJobClass = K8s.crd.makeCustomResourceClass({
  apiInfo: [{ group: 'trainer.kubeflow.org', version: 'v1alpha1' }],
  isNamespaced: true,
  pluralName: 'trainjobs',
  singularName: 'trainjob',
  kind: 'TrainJob',
});
