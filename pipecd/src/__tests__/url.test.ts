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

import * as headlampUtils from '@kinvolk/headlamp-plugin/lib/Utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pluginURL } from '../utils/url';

vi.mock('@kinvolk/headlamp-plugin/lib/Utils', async importOriginal => {
  const original = await importOriginal<typeof import('@kinvolk/headlamp-plugin/lib/Utils')>();
  return { ...original, getCluster: vi.fn() };
});

afterEach(() => {
  vi.mocked(headlampUtils.getCluster).mockReset();
});

describe('pluginURL', () => {
  it('prefixes the path with the active cluster', () => {
    vi.mocked(headlampUtils.getCluster).mockReturnValue('kind-pipecd');

    expect(pluginURL('/pipecd/applications/app-1')).toBe(
      '/c/kind-pipecd/pipecd/applications/app-1'
    );
  });

  it('leaves the path alone when no cluster is selected', () => {
    vi.mocked(headlampUtils.getCluster).mockReturnValue(null);

    expect(pluginURL('/pipecd/applications')).toBe('/pipecd/applications');
  });
});
