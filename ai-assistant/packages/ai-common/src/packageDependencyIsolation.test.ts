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

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { describe, expect, it } from 'vitest';

// ai-common is shared by the plugin, CLI, and UI packages. Depending on the Headlamp plugin
// runtime here would make the shared package platform-specific and invert that dependency.
describe('ai-common dependency isolation', () => {
  const pkgPath = resolve(__dirname, '..', 'package.json');
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));

  it('does not declare the Headlamp plugin runtime in any dependency section', () => {
    for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
      expect(pkg[section]?.['@kinvolk/headlamp-plugin'], section).toBeUndefined();
    }
  });
});
