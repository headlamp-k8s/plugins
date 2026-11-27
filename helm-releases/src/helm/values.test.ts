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
import { coalesceValues, hasValues, valuesToYaml } from './values';

describe('coalesceValues', () => {
  it('merges the user values over the chart defaults, key by key', () => {
    const defaults = {
      replicaCount: 1,
      image: { repository: 'nginx', tag: 'stable', pullPolicy: 'IfNotPresent' },
      service: { type: 'ClusterIP' },
    };
    const user = { replicaCount: 3, image: { tag: '1.27' }, ingress: { enabled: true } };

    expect(coalesceValues(defaults, user)).toEqual({
      replicaCount: 3,
      image: { repository: 'nginx', tag: '1.27', pullPolicy: 'IfNotPresent' },
      service: { type: 'ClusterIP' },
      ingress: { enabled: true },
    });
  });

  it('removes the default keys the user set to null, as Helm does', () => {
    const defaults = { resources: { limits: { cpu: '1' } }, probes: { liveness: { path: '/' } } };
    const user = { resources: null, probes: { liveness: null } };

    expect(coalesceValues(defaults, user)).toEqual({ probes: {} });
  });

  it('replaces lists and mismatched types instead of merging them', () => {
    const defaults = { args: ['--a', '--b'], persistence: { enabled: false }, port: 80 };
    const user = { args: ['--c'], persistence: 'none', port: { http: 8080 } };

    expect(coalesceValues(defaults, user)).toEqual(user);
  });

  it('leaves both inputs untouched', () => {
    const defaults = { image: { tag: 'stable' }, hosts: [{ name: 'a' }] };
    const user = { image: { tag: '1.27' } };

    const merged = coalesceValues(defaults, user);
    (merged.hosts as { name: string }[])[0].name = 'changed';
    (merged.image as { tag: string }).tag = 'changed';

    expect(defaults).toEqual({ image: { tag: 'stable' }, hosts: [{ name: 'a' }] });
    expect(user).toEqual({ image: { tag: '1.27' } });
  });
});

describe('valuesToYaml', () => {
  it('prints sorted keys and keeps long strings on one line', () => {
    const long = 'word '.repeat(40).trim();

    expect(valuesToYaml({ zeta: 1, alpha: { nested: true }, text: long })).toBe(
      `alpha:\n  nested: true\ntext: ${long}\nzeta: 1\n`
    );
  });

  it('prints nothing for empty values', () => {
    expect(valuesToYaml({})).toBe('');
    expect(hasValues({})).toBe(false);
    expect(hasValues({ a: 1 })).toBe(true);
  });
});
