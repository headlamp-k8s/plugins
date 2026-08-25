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

import { afterEach, expect, it } from 'vitest';
import { isAksDesktopHost } from './host';

afterEach(() => {
  delete window.desktopApi;
});

it('detects AKS Desktop through the registerAKSCluster bridge', () => {
  window.desktopApi = {
    registerAKSCluster: () => undefined,
  } as unknown as typeof window.desktopApi;
  expect(isAksDesktopHost()).toBe(true);
});

it('is false without a desktop bridge', () => {
  expect(isAksDesktopHost()).toBe(false);
});

it('is false for desktop hosts that do not expose registerAKSCluster', () => {
  window.desktopApi = {} as unknown as typeof window.desktopApi;
  expect(isAksDesktopHost()).toBe(false);
});
