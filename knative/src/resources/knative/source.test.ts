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

import { vi } from 'vitest';

vi.mock('./conditionedResource', () => ({
  ConditionedKnativeCustomResource: class {
    jsonData: { spec?: unknown };

    constructor(jsonData: { spec?: unknown }) {
      this.jsonData = jsonData;
    }

    get spec() {
      return this.jsonData.spec;
    }
  },
}));

import { getKnativeSourceClass } from './source';

const pingSource = {
  kind: 'PingSource',
  apiName: 'pingsources',
  apiVersion: 'sources.knative.dev/v1',
  isNamespaced: true,
};

describe('getKnativeSourceClass', () => {
  it('builds a class that requests the kind with its API version', () => {
    const sourceClass = getKnativeSourceClass(pingSource);

    expect({
      kind: sourceClass.kind,
      apiName: sourceClass.apiName,
      apiVersion: sourceClass.apiVersion,
      isNamespaced: sourceClass.isNamespaced,
    }).toEqual(pingSource);
  });

  it('gives the same class for the same kind, so its list keeps its watch', () => {
    expect(getKnativeSourceClass({ ...pingSource })).toBe(getKnativeSourceClass(pingSource));
  });

  it('gives a new class when the API version to request changes', () => {
    const v1beta2 = getKnativeSourceClass({
      ...pingSource,
      apiVersion: 'sources.knative.dev/v1beta2',
    });

    expect(v1beta2).not.toBe(getKnativeSourceClass(pingSource));
    expect(v1beta2.apiVersion).toBe('sources.knative.dev/v1beta2');
  });
});

describe('KnativeSource', () => {
  it('reads the sink from the spec', () => {
    const sink = {
      ref: { apiVersion: 'eventing.knative.dev/v1', kind: 'Broker', name: 'default' },
    };
    const SourceClass = getKnativeSourceClass(pingSource);
    const json = {
      apiVersion: 'sources.knative.dev/v1',
      kind: 'PingSource',
      metadata: { name: 'heartbeat', uid: 'uid-1', creationTimestamp: '' },
    } satisfies ConstructorParameters<typeof SourceClass>[0];

    expect(new SourceClass({ ...json, spec: { sink } }).sink).toEqual(sink);
    expect(new SourceClass(json).sink).toBeUndefined();
  });
});
