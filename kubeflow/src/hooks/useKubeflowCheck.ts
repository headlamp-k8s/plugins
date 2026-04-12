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

import { useEffect, useState } from 'react';
import { isAnyKubeflowFamilyInstalled, isApiGroupInstalled } from '../checks/isKubeflowInstalled';

export function useApiGroupInstalled(apiPath: string) {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for Storybook global mock
    if ((window as any).HEADLAMP_KUBEFLOW_STORYBOOK_MOCK) {
      setIsInstalled(true);
      return;
    }

    let mounted = true;
    async function checkInstalled() {
      const installed = await isApiGroupInstalled(apiPath);
      if (mounted) setIsInstalled(installed);
    }
    checkInstalled();
    return () => {
      mounted = false;
    };
  }, [apiPath]);

  return {
    isInstalled,
    isCheckLoading: isInstalled === null,
  };
}

export function useAnyKubeflowFamilyInstalled() {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for Storybook global mock
    if ((window as any).HEADLAMP_KUBEFLOW_STORYBOOK_MOCK) {
      setIsInstalled(true);
      return;
    }

    let mounted = true;
    async function checkInstalled() {
      const installed = await isAnyKubeflowFamilyInstalled();
      if (mounted) setIsInstalled(installed);
    }
    checkInstalled();
    return () => {
      mounted = false;
    };
  }, []);

  return {
    isInstalled,
    isCheckLoading: isInstalled === null,
  };
}
