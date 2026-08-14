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

import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { describe, expect, it } from 'vitest';
import { DETACHED_ANNOTATION, detachPatch, getDetachIntent } from './detachAction';

/** Builds a minimal BareMetalHost-shaped object, optionally already detached. */
function host(detached?: boolean): KubeObject {
  return {
    jsonData: { metadata: { annotations: detached ? { [DETACHED_ANNOTATION]: '' } : {} } },
  } as unknown as KubeObject;
}

describe('getDetachIntent', () => {
  it('offers to detach a host that is attached', () => {
    expect(getDetachIntent(host(false))).toEqual({
      isDetached: false,
      targetDetached: true,
      label: 'Detach',
    });
  });

  it('offers to attach a host that is detached', () => {
    expect(getDetachIntent(host(true))).toEqual({
      isDetached: true,
      targetDetached: false,
      label: 'Attach',
    });
  });
});

describe('detachPatch', () => {
  it('adds the annotation to detach', () => {
    expect(detachPatch(true)).toEqual({
      metadata: { annotations: { [DETACHED_ANNOTATION]: '' } },
    });
  });

  it('sets the annotation to null to re-attach', () => {
    expect(detachPatch(false)).toEqual({
      metadata: { annotations: { [DETACHED_ANNOTATION]: null } },
    });
  });
});
