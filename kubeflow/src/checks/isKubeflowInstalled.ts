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

import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

export const KUBEFLOW_NOTEBOOKS_API = '/apis/kubeflow.org/v1';
export const KUBEFLOW_KATIB_API = '/apis/kubeflow.org/v1beta1';
export const KUBEFLOW_PIPELINES_API = '/apis/pipelines.kubeflow.org';
export const KUBEFLOW_TRAINING_API = '/apis/trainer.kubeflow.org/v1alpha1';
export const KUBEFLOW_SPARK_API = '/apis/sparkoperator.k8s.io/v1beta2';

export const KUBEFLOW_API_PATHS = [
  KUBEFLOW_NOTEBOOKS_API,
  KUBEFLOW_KATIB_API,
  KUBEFLOW_PIPELINES_API,
  KUBEFLOW_TRAINING_API,
  KUBEFLOW_SPARK_API,
];

export async function isApiGroupInstalled(apiPath: string): Promise<boolean> {
  // Check for Storybook global mock
  if (typeof window !== 'undefined' && (window as any).HEADLAMP_KUBEFLOW_STORYBOOK_MOCK) {
    return true;
  }

  try {
    const response = await ApiProxy.request(apiPath, {
      method: 'GET',
    });
    return !!response;
  } catch (error) {
    return false;
  }
}

export const checkNotebooksInstalled = () => isApiGroupInstalled(KUBEFLOW_NOTEBOOKS_API);
export const checkKatibInstalled = () => isApiGroupInstalled(KUBEFLOW_KATIB_API);
export const checkPipelinesInstalled = () => isApiGroupInstalled(KUBEFLOW_PIPELINES_API);
export const checkTrainingInstalled = () => isApiGroupInstalled(KUBEFLOW_TRAINING_API);
export const checkSparkInstalled = () => isApiGroupInstalled(KUBEFLOW_SPARK_API);

export async function isAnyKubeflowFamilyInstalled(): Promise<boolean> {
  const checks = await Promise.all([
    checkNotebooksInstalled(),
    checkKatibInstalled(),
    checkPipelinesInstalled(),
    checkTrainingInstalled(),
    checkSparkInstalled(),
  ]);
  return checks.some(isInstalled => isInstalled);
}
