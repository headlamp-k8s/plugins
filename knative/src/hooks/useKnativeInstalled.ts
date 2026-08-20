/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useEffect, useState } from 'react';
import { isKnativeComponentInstalled, type KnativeComponent } from '../isKnativeInstalled';

/**
 * Tracks whether the Knative component a view needs is installed.
 *
 * Serving and Eventing install independently, so a view has to say which one it
 * needs rather than ask whether Knative in general is present.
 *
 * @param component The Knative component the view depends on.
 * @param clusters The clusters the view is showing.
 * @returns The result of the check, and whether it is still running.
 */
export function useKnativeInstalled(component: KnativeComponent, clusters: string[]) {
  const clustersKey = clusters.join(',');

  const [isKnativeInstalledState, setIsKnativeInstalledState] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkKnativeInstalled() {
      setIsKnativeInstalledState(null);
      const installed = await isKnativeComponentInstalled(component, clusters);
      if (cancelled) {
        return;
      }
      setIsKnativeInstalledState(installed);
    }

    checkKnativeInstalled();

    return () => {
      cancelled = true;
    };
  }, [component, clustersKey]);

  return {
    isKnativeInstalled: isKnativeInstalledState,
    isKnativeCheckLoading: isKnativeInstalledState === null,
  };
}
