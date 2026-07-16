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

import { readdirSync, readFileSync, statSync } from 'fs';
import { join, relative, resolve } from 'path';
import { describe, expect, it } from 'vitest';

// LangChain adapters are implementation details owned by topic-local folders in ai-common.
// Plugin, CLI, and UI consumers must use public topic entrypoints so adapters can change
// without coupling every consumer to the underlying framework.
const packageRoot = resolve(__dirname, '../../..');
const consumerRoots = [
  resolve(packageRoot, 'src'),
  resolve(packageRoot, 'packages/ai-cli/src'),
  resolve(packageRoot, 'packages/ai-ui/src'),
];

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap(entry => {
    const path = join(directory, entry);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(?:ts|tsx)$/.test(entry) ? [path] : [];
  });
}

describe('ai-common consumer import boundaries', () => {
  it('prevents plugin, CLI, and UI source from importing internal LangChain adapter paths', () => {
    const violations = consumerRoots.flatMap(root =>
      sourceFiles(root).flatMap(file => {
        const source = readFileSync(file, 'utf8');
        return /@headlamp-k8s\/ai-common\/(?:[^'"\n]+\/)?langchain(?:\/|['"])/.test(source)
          ? [relative(packageRoot, file)]
          : [];
      })
    );

    expect(violations).toEqual([]);
  });
});
