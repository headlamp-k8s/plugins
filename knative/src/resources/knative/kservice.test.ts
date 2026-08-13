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

import { describe, expect, it, vi } from 'vitest';

vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class {},
  KubeContainerProbe: {},
}));

import { KService } from './kservice';

describe('KService.buildAutoscalingPatch', () => {
  it('returns null when all params are undefined (no-op)', () => {
    expect(KService.buildAutoscalingPatch({})).toBeNull();
  });

  it('returns null when every param is explicitly undefined', () => {
    expect(
      KService.buildAutoscalingPatch({
        metric: undefined,
        target: undefined,
        minScale: undefined,
        containerConcurrency: undefined,
      })
    ).toBeNull();
  });

  it('emits string values for non-null annotation params', () => {
    const patch = KService.buildAutoscalingPatch({ minScale: 3, maxScale: 10 });
    expect(patch).not.toBeNull();
    expect(patch!.spec.template.metadata!.annotations!['autoscaling.knative.dev/min-scale']).toBe(
      '3'
    );
    expect(patch!.spec.template.metadata!.annotations!['autoscaling.knative.dev/max-scale']).toBe(
      '10'
    );
  });

  it('emits containerConcurrency in spec', () => {
    const patch = KService.buildAutoscalingPatch({ containerConcurrency: 50 });
    expect(patch).not.toBeNull();
    expect(patch!.spec.template.spec!.containerConcurrency).toBe(50);
  });

  it('emits null for a cleared annotation (deletion via merge-patch)', () => {
    const patch = KService.buildAutoscalingPatch({ minScale: null });
    expect(patch).not.toBeNull();
    expect(patch!.spec.template.metadata!.annotations!['autoscaling.knative.dev/min-scale']).toBe(
      null
    );
  });

  it('emits null for cleared containerConcurrency', () => {
    const patch = KService.buildAutoscalingPatch({ containerConcurrency: null });
    expect(patch).not.toBeNull();
    expect(patch!.spec.template.spec!.containerConcurrency).toBe(null);
  });

  it('mixes deletion nulls with value updates and omissions', () => {
    const patch = KService.buildAutoscalingPatch({
      minScale: null,
      maxScale: 5,
      initialScale: undefined,
      containerConcurrency: null,
    });
    expect(patch).not.toBeNull();
    const anns = patch!.spec.template.metadata!.annotations!;
    expect(anns['autoscaling.knative.dev/min-scale']).toBe(null);
    expect(anns['autoscaling.knative.dev/max-scale']).toBe('5');
    expect(anns).not.toHaveProperty('autoscaling.knative.dev/initial-scale');
    expect(patch!.spec.template.spec!.containerConcurrency).toBe(null);
  });

  it('does not include unrelated annotation keys', () => {
    const patch = KService.buildAutoscalingPatch({ minScale: 1 });
    const anns = patch!.spec.template.metadata!.annotations!;
    const keys = Object.keys(anns);
    expect(keys).toEqual(['autoscaling.knative.dev/min-scale']);
  });
});
