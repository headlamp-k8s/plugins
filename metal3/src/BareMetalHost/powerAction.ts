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

/** The power action a host offers, derived from its current `spec.online`. */
export interface PowerIntent {
  /** Whether the host is currently powered on, per `spec.online`. */
  isOn: boolean;
  /** The value `spec.online` should be set to when the action runs. */
  targetOnline: boolean;
  /** Button label naming the action that will happen. */
  label: string;
}

/**
 * Derives the power action to offer for a host from its `spec.online` intent.
 * A host with no `spec.online` is treated as off, so the action offered is to
 * power it on. This is pure so the button's label and target can be unit-tested
 * without a running cluster.
 *
 * @param host - The BareMetalHost to read `spec.online` from.
 * @returns The current power state, the target value, and the button label.
 */
export function getPowerIntent(host: KubeObject): PowerIntent {
  const isOn = host.jsonData.spec?.online === true;
  return {
    isOn,
    targetOnline: !isOn,
    label: isOn ? 'Power Off' : 'Power On',
  };
}

/**
 * Builds the merge patch that sets a host's power intent. Power is a declarative
 * spec field, so the action is a single-field patch; the operator carries out the
 * actual power change over the host's BMC.
 *
 * @param targetOnline - The value to set `spec.online` to.
 * @returns The merge-patch body for `KubeObject.patch`.
 */
export function powerPatch(targetOnline: boolean): { spec: { online: boolean } } {
  return { spec: { online: targetOnline } };
}
