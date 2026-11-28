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
import { adapterServiceFrom, DEFAULT_ADAPTER_SERVICE } from './settings';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({ ConfigStore: class {} }));

describe('adapterServiceFrom', () => {
  it('uses the defaults when nothing is saved', () => {
    expect(adapterServiceFrom(undefined)).toEqual(DEFAULT_ADAPTER_SERVICE);
    expect(adapterServiceFrom(null)).toEqual(DEFAULT_ADAPTER_SERVICE);
    expect(adapterServiceFrom({})).toEqual(DEFAULT_ADAPTER_SERVICE);
  });

  it('uses each saved value and the default for the rest', () => {
    expect(adapterServiceFrom({ adapterNamespace: 'cilium', adapterPort: '8080' })).toEqual({
      namespace: 'cilium',
      name: DEFAULT_ADAPTER_SERVICE.name,
      port: '8080',
    });
  });

  it('treats a field with only spaces as empty and trims the others', () => {
    expect(adapterServiceFrom({ adapterNamespace: '   ', adapterName: ' flows ' })).toEqual({
      ...DEFAULT_ADAPTER_SERVICE,
      name: 'flows',
    });
  });
});
