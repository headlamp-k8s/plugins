/*
 * Copyright 2026 The Kubernetes Authors
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

import fs from 'node:fs';
import path from 'node:path';

/**
 * Guards against importing Headlamp modules by a path the plugin bundler does
 * not externalise.
 *
 * Such an import type-checks, lints, builds, and passes every unit test, then
 * fails only in the browser: the bundle emits a reference to a global that does
 * not exist, and Headlamp reports "Plugin execution error ... Cannot read
 * properties of undefined". Importing `lib/k8s/KubeObject` instead of
 * `lib/k8s/cluster` did exactly that, and took the whole plugin down with it.
 *
 * The allowed list mirrors the module-to-global map in
 * node_modules/@kinvolk/headlamp-plugin/config/vite.config.mjs.
 */
const ALLOWED_HEADLAMP_IMPORTS = new Set([
  '@kinvolk/headlamp-plugin/lib',
  '@kinvolk/headlamp-plugin/lib/ApiProxy',
  '@kinvolk/headlamp-plugin/lib/CommonComponents',
  '@kinvolk/headlamp-plugin/lib/Crd',
  '@kinvolk/headlamp-plugin/lib/K8s',
  '@kinvolk/headlamp-plugin/lib/Notification',
  '@kinvolk/headlamp-plugin/lib/Router',
  '@kinvolk/headlamp-plugin/lib/Utils',
  '@kinvolk/headlamp-plugin/lib/components/common',
  '@kinvolk/headlamp-plugin/lib/k8s',
  '@kinvolk/headlamp-plugin/lib/k8s/cluster',
  '@kinvolk/headlamp-plugin/lib/k8s/crd',
]);

const SRC_DIR = path.join(__dirname, '..');

function collectSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return collectSourceFiles(full);
    }
    return /\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

describe('Headlamp module imports', () => {
  it('only imports Headlamp modules the bundler externalises', () => {
    const offenders: string[] = [];

    for (const file of collectSourceFiles(SRC_DIR)) {
      const source = fs.readFileSync(file, 'utf8');
      for (const match of source.matchAll(/from '(@kinvolk\/headlamp-plugin[^']*)'/g)) {
        const specifier = match[1];
        if (!ALLOWED_HEADLAMP_IMPORTS.has(specifier)) {
          offenders.push(`${path.relative(SRC_DIR, file)}: ${specifier}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
