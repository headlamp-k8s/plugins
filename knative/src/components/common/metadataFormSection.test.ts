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
import { metadataFormSection } from './metadataFormSection';

describe('metadataFormSection', () => {
  it('asks for a name, a namespace and labels, and needs the first two', () => {
    const section = metadataFormSection();
    expect(section.title).toBe('Metadata');
    expect(
      section.fields.map(({ key, path, type, required }) => ({ key, path, type, required }))
    ).toEqual([
      { key: 'name', path: 'metadata.name', type: undefined, required: true },
      { key: 'namespace', path: 'metadata.namespace', type: 'namespace', required: true },
      { key: 'labels', path: 'metadata.labels', type: 'labels', required: undefined },
    ]);
  });
});
