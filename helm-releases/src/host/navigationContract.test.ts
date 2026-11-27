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

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';

const sourceRoot = join(process.cwd(), 'src');

function sourceFiles(root: string): string[] {
  return readdirSync(root)
    .flatMap(entry => {
      const path = join(root, entry);
      return statSync(path).isDirectory() ? sourceFiles(path) : [path];
    })
    .filter(path => /\.(ts|tsx)$/.test(path) && !/\.test\.tsx?$/.test(path));
}

function filesMatching(pattern: RegExp, except: string[] = []): string[] {
  return sourceFiles(sourceRoot)
    .filter(path => pattern.test(readFileSync(path, 'utf8')))
    .map(path => relative(sourceRoot, path))
    .filter(path => !except.includes(path));
}

describe('Headlamp navigation contract', () => {
  it('does not embed cluster-relative paths in internal links', () => {
    // Such a link would miss the /c/<cluster> prefix: routes are resolved by name instead.
    expect(filesMatching(/(?:href|to)\s*=\s*(?:\{\s*)?[`'"]\/helm-releases/)).toEqual([]);
  });

  it('stays clear of the /helm routes of the app-catalog plugin', () => {
    expect(filesMatching(/[`'"]\/helm\//)).toEqual([]);
  });
});

describe('read-only contract', () => {
  it('reaches the cluster through the Headlamp transport only', () => {
    expect(
      filesMatching(/\bfetch\(|XMLHttpRequest|ApiProxy\.|apiFactory/, ['host/headlampTransport.ts'])
    ).toEqual([]);
  });

  it('only issues GET requests', () => {
    const transport = readFileSync(join(sourceRoot, 'host/headlampTransport.ts'), 'utf8');

    expect(transport.match(/method: '(\w+)'/g)).toEqual(["method: 'GET'"]);
    expect(
      filesMatching(/\b(post|put|patch|remove|apply|jsonPatch)\(|method:\s*['"](?!GET)/i)
    ).toEqual([]);
  });
});
