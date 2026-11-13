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
    jsonData: { spec?: unknown; metadata: { name: string; namespace?: string } };

    constructor(jsonData: { spec?: unknown; metadata: { name: string; namespace?: string } }) {
      this.jsonData = jsonData;
    }

    get spec() {
      return this.jsonData.spec;
    }

    getDetailsLink() {
      const { namespace, name } = this.jsonData.metadata;
      return ['/c/cluster-a+cluster-b/knative/sources', namespace, name].filter(Boolean).join('/');
    }

    _class() {
      return this.constructor;
    }
  },
}));

import { KNATIVE_SOURCE_KINDS } from './eventingData';
import { getKnativeSourceClass, SOURCE_FAMILY } from './source';

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
    expect(sourceClass.detailsRoute).toBe('knativeSourceDetails');
    expect(sourceClass.listRoute).toBe('knativeSources');
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

  it('shows the rest of its spec as its settings, without the sink', () => {
    const SourceClass = getKnativeSourceClass(pingSource);
    const json = {
      apiVersion: 'sources.knative.dev/v1',
      kind: 'PingSource',
      metadata: { name: 'heartbeat', uid: 'uid-1', creationTimestamp: '' },
    } satisfies ConstructorParameters<typeof SourceClass>[0];
    const sink = { uri: 'https://example.com/events' };
    const ceOverrides = { extensions: { team: 'shop' } };

    expect(
      new SourceClass({ ...json, spec: { schedule: '0 * * * *', ceOverrides, sink } }).settings
    ).toEqual({ schedule: '0 * * * *', ceOverrides });
    expect(new SourceClass({ ...json, spec: { sink } }).settings).toBeUndefined();
    expect(new SourceClass(json).settings).toBeUndefined();
  });

  it.each([
    [
      'in its namespace',
      pingSource,
      'shop',
      '/c/cluster-a+cluster-b/knative/sources/shop/heartbeat?crd=pingsources.sources.knative.dev',
    ],
    [
      'of a cluster-scoped kind, without a namespace',
      {
        kind: 'WidgetSource',
        apiName: 'widgetsources',
        apiVersion: 'example.dev/v1',
        isNamespaced: false,
      },
      undefined,
      '/c/cluster-a+cluster-b/knative/sources/heartbeat?crd=widgetsources.example.dev',
    ],
  ])(
    'links to its page %s, keeping the selected clusters and naming its CRD',
    (_case, info, namespace, link) => {
      const SourceClass = getKnativeSourceClass(info);

      expect(
        new SourceClass({
          apiVersion: info.apiVersion,
          kind: info.kind,
          metadata: { name: 'heartbeat', namespace, uid: 'uid-1', creationTimestamp: '' },
        }).getDetailsLink()
      ).toBe(link);
    }
  );
});

describe('SOURCE_FAMILY', () => {
  it("finds every Source kind by its label, or Knative's own kinds", () => {
    expect(SOURCE_FAMILY).toEqual({
      labelKey: 'duck.knative.dev/source',
      fallbackKinds: KNATIVE_SOURCE_KINDS,
      getKindClass: getKnativeSourceClass,
    });
  });
});
