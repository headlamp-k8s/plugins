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

export async function isApiGroupInstalled(apiPath: string): Promise<boolean> {
  try {
    const response = await ApiProxy.request(apiPath, {
      method: 'GET',
    });
    return !!response;
  } catch (error) {
    return false;
  }
}

export const checkNotebooksInstalled = () => isApiGroupInstalled('/apis/kubeflow.org/v1');
export const checkKatibInstalled = () => isApiGroupInstalled('/apis/kubeflow.org/v1beta1');
export const checkPipelinesInstalled = () => isApiGroupInstalled('/apis/pipelines.kubeflow.org');
export const checkTrainingInstalled = () =>
  isApiGroupInstalled('/apis/trainer.kubeflow.org/v1alpha1');
export const checkSparkInstalled = () => isApiGroupInstalled('/apis/sparkoperator.k8s.io/v1beta2');

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
