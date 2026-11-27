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

import { describe, expect, it } from 'vitest';
import { collapseUnchanged, diffLines, hasChanges } from './diff';

function render(before: string, after: string): string[] {
  const prefix = { same: ' ', added: '+', removed: '-' };
  return diffLines(before, after).map(line => `${prefix[line.kind]}${line.text}`);
}

describe('diffLines', () => {
  it('reports the changed lines between two texts', () => {
    const before = 'image:\n  tag: 1.26\nreplicaCount: 1\nservice:\n  type: ClusterIP\n';
    const after =
      'image:\n  tag: 1.27\nreplicaCount: 1\nresources: {}\nservice:\n  type: ClusterIP\n';

    expect(render(before, after)).toEqual([
      ' image:',
      '-  tag: 1.26',
      '+  tag: 1.27',
      ' replicaCount: 1',
      '+resources: {}',
      ' service:',
      '   type: ClusterIP',
    ]);
  });

  it('finds no change between identical texts', () => {
    const lines = diffLines('a: 1\nb: 2\n', 'a: 1\nb: 2\n');

    expect(hasChanges(lines)).toBe(false);
    expect(lines).toHaveLength(2);
  });

  it('handles empty sides', () => {
    expect(render('', 'a: 1\n')).toEqual(['+a: 1']);
    expect(render('a: 1\n', '')).toEqual(['-a: 1']);
    expect(render('', '')).toEqual([]);
  });

  it('reports a too large changed region as replaced instead of freezing the page', () => {
    const before = Array.from({ length: 2100 }, (_, index) => `before-${index}`).join('\n');
    const after = Array.from({ length: 2100 }, (_, index) => `after-${index}`).join('\n');

    const lines = diffLines(`same\n${before}\nend`, `same\n${after}\nend`);

    expect(lines).toHaveLength(4202);
    expect(lines[0]).toEqual({ kind: 'same', text: 'same' });
    expect(lines[1]).toEqual({ kind: 'removed', text: 'before-0' });
    expect(lines[2101]).toEqual({ kind: 'added', text: 'after-0' });
    expect(lines[4201]).toEqual({ kind: 'same', text: 'end' });
  });
});

describe('collapseUnchanged', () => {
  it('folds the unchanged lines away from the changes', () => {
    const before = Array.from({ length: 20 }, (_, index) => `line-${index}`);
    const after = [...before];
    after[10] = 'changed';

    const rows = collapseUnchanged(diffLines(before.join('\n'), after.join('\n')), 2);

    expect(rows).toEqual([
      { kind: 'gap', count: 8 },
      { kind: 'same', text: 'line-8' },
      { kind: 'same', text: 'line-9' },
      { kind: 'removed', text: 'line-10' },
      { kind: 'added', text: 'changed' },
      { kind: 'same', text: 'line-11' },
      { kind: 'same', text: 'line-12' },
      { kind: 'gap', count: 7 },
    ]);
  });
});
