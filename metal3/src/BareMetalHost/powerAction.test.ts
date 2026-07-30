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

import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { describe, expect, it } from 'vitest';
import { getPowerIntent, powerPatch } from './powerAction';

/** Builds a minimal BareMetalHost-shaped object with the given `spec.online`. */
function host(online?: boolean): KubeObject {
  return { jsonData: { spec: online === undefined ? {} : { online } } } as unknown as KubeObject;
}

describe('getPowerIntent', () => {
  it('offers to power off a host that is on', () => {
    expect(getPowerIntent(host(true))).toEqual({
      isOn: true,
      targetOnline: false,
      label: 'Power Off',
    });
  });

  it('offers to power on a host that is off', () => {
    expect(getPowerIntent(host(false))).toEqual({
      isOn: false,
      targetOnline: true,
      label: 'Power On',
    });
  });

  it('treats a host with no online intent as off', () => {
    expect(getPowerIntent(host())).toEqual({
      isOn: false,
      targetOnline: true,
      label: 'Power On',
    });
  });
});

describe('powerPatch', () => {
  it('builds a patch that powers on', () => {
    expect(powerPatch(true)).toEqual({ spec: { online: true } });
  });

  it('builds a patch that powers off', () => {
    expect(powerPatch(false)).toEqual({ spec: { online: false } });
  });
});
