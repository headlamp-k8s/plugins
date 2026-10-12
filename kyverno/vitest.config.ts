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

import baseConfig from '@kinvolk/headlamp-plugin/config/vite.config.mjs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, mergeConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

// The shared headlamp-plugin vite config marks '@kinvolk/headlamp-plugin/lib/k8s/*'
// as an external module for the *build* step, so that the real Headlamp app can
// supply it at runtime via the global pluginLib object. That path does not exist
// on disk under a single "lib" (the real files live under lib/lib/k8s/*), which
// means any test that imports a resource class (e.g. one extending KubeObject)
// fails to resolve, even though the build itself works fine.
//
// Aliasing straight to the real lib/lib/k8s/cluster.js pulls in the full k8s
// module barrel (every resource class Headlamp ships), which fails to load
// outside of a full app bootstrap. Resource classes only need the small bit of
// jsonData/cluster bookkeeping KubeObject provides, so we alias to a local
// stub (src/test-utils/kubeObjectStub.ts) instead, letting resource classes be
// unit tested directly without needing the whole app running.
export default mergeConfig(
  baseConfig,
  defineConfig({
    resolve: {
      alias: {
        '@kinvolk/headlamp-plugin/lib/k8s/cluster': resolve(
          __dirname,
          'src/test-utils/kubeObjectStub.ts'
        ),
      },
    },
  })
);
