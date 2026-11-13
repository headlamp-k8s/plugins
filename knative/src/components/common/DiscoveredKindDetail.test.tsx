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

import type { KubeCRD } from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { render } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';
import type { KnativeResourceClass } from '../../resources/knative/customResourceLinks';

/** Stands in for the class of a kind, recording the kind it was built for. */
type KindClassStub = {
  /** The kind the class was built for. */
  classFor: KnativeResourceClass;
};

const context = vi.hoisted(() => ({
  crd: 'kafkachannels.messaging.knative.dev',
  crdResult: [null, null] as [unknown, unknown],
  gets: [] as unknown[][],
  shown: [] as KindClassStub[],
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({ K8s: { useCluster: () => 'cluster-a' } }));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  EmptyContent: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  Loader: ({ title }: { title: string }) => <>{title}</>,
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => ({ search: `?crd=${context.crd}` }),
}));

vi.mock('../../resources/k8s/customResourceDefinition', () => ({
  CustomResourceDefinition: {
    useGet: (...args: unknown[]) => {
      React.useRef(args);
      context.gets.push(args);
      return [...context.crdResult];
    },
  },
}));

vi.mock('../../resources/knative', async () => ({
  getKnativeCrdName: (
    await vi.importActual<typeof import('../../resources/knative/customResourceLinks')>(
      '../../resources/knative/customResourceLinks'
    )
  ).getKnativeCrdName,
}));

import { DiscoveredKindDetail } from './DiscoveredKindDetail';

const inMemoryChannel: KnativeResourceClass = {
  kind: 'InMemoryChannel',
  apiName: 'inmemorychannels',
  apiVersion: 'messaging.knative.dev/v1',
  isNamespaced: true,
};

const kafkaCrd: KubeCRD = {
  apiVersion: 'apiextensions.k8s.io/v1',
  kind: 'CustomResourceDefinition',
  metadata: {
    name: 'kafkachannels.messaging.knative.dev',
    uid: 'uid-1',
    creationTimestamp: '',
    labels: { 'messaging.knative.dev/subscribable': 'true' },
  },
  spec: {
    group: 'messaging.knative.dev',
    version: 'v1beta1',
    names: {
      plural: 'kafkachannels',
      singular: 'kafkachannel',
      kind: 'KafkaChannel',
      listKind: 'KafkaChannelList',
    },
    scope: 'Namespaced',
    versions: [
      { name: 'v1beta1', served: true, storage: true, additionalPrinterColumns: [] },
      { name: 'v1', served: true, storage: false, additionalPrinterColumns: [] },
    ],
  },
};

/**
 * Records the class it is asked to show the object with, as a page would.
 *
 * @param props - The class of the object's kind.
 * @returns Nothing.
 */
function Page({
  kindClass,
}: {
  /** The class of the object's kind. */
  kindClass: KindClassStub;
}) {
  context.shown.push(kindClass);
  return null;
}

/**
 * Renders the page for the CRD in `context`.
 *
 * @returns The page's text and the last kind it showed, if any.
 */
function renderDetail() {
  context.gets.length = 0;
  context.shown.length = 0;
  const { container } = render(
    <React.StrictMode>
      <DiscoveredKindDetail
        family={{
          labelKey: 'messaging.knative.dev/subscribable',
          excludedCrds: ['channels.messaging.knative.dev'],
          fallbackKinds: [inMemoryChannel],
          getKindClass: info => ({ classFor: info }),
        }}
        kindLabel="channel implementation"
        page={Page}
      />
    </React.StrictMode>
  );
  return { text: container.textContent, shown: context.shown[context.shown.length - 1] };
}

describe('DiscoveredKindDetail', () => {
  beforeEach(() => {
    context.crd = 'kafkachannels.messaging.knative.dev';
    context.crdResult = [{ metadata: kafkaCrd.metadata, jsonData: kafkaCrd }, null];
  });

  it('shows the object with the class of the kind its CRD defines, at the stored version', () => {
    const { shown } = renderDetail();

    expect(context.gets[0]).toEqual([
      'kafkachannels.messaging.knative.dev',
      undefined,
      { cluster: 'cluster-a' },
    ]);
    expect(shown).toEqual({
      classFor: {
        kind: 'KafkaChannel',
        apiName: 'kafkachannels',
        apiVersion: 'messaging.knative.dev/v1beta1',
        isNamespaced: true,
      },
    });
  });

  it('starts the page over when the link names another CRD', () => {
    const instances = new Set<object>();
    /**
     * Remembers each page instance it renders as.
     *
     * @returns Nothing.
     */
    function InstancePage() {
      instances.add(React.useRef({}).current);
      return null;
    }
    const family = {
      labelKey: 'messaging.knative.dev/subscribable',
      fallbackKinds: [],
      getKindClass: (info: KnativeResourceClass) => info,
    };
    const detail = () => (
      <DiscoveredKindDetail
        family={family}
        kindLabel="channel implementation"
        page={InstancePage}
      />
    );
    const { rerender } = render(detail());
    const natsCrd = {
      ...kafkaCrd,
      metadata: { ...kafkaCrd.metadata, name: 'natsjetstreamchannels.messaging.knative.dev' },
      spec: {
        ...kafkaCrd.spec,
        names: {
          ...kafkaCrd.spec.names,
          plural: 'natsjetstreamchannels',
          kind: 'NatsJetStreamChannel',
        },
      },
    };
    context.crd = 'natsjetstreamchannels.messaging.knative.dev';
    context.crdResult = [{ metadata: natsCrd.metadata, jsonData: natsCrd }, null];
    rerender(detail());

    expect(instances.size).toBe(2);
  });

  it('waits while the CRD loads', () => {
    context.crdResult = [null, null];
    const { text, shown } = renderDetail();

    expect(text).toBe("Loading the channel implementation's CustomResourceDefinition");
    expect(shown).toBeUndefined();
  });

  it("still shows Knative's own kind when its CRD cannot be read", () => {
    context.crd = 'inmemorychannels.messaging.knative.dev';
    context.crdResult = [null, new Error('forbidden')];

    expect(renderDetail().shown).toEqual({ classFor: inMemoryChannel });
  });

  it('says so when the CRD of another kind cannot be read', () => {
    context.crdResult = [null, new Error('forbidden')];
    const { text, shown } = renderDetail();

    expect(text).toBe(
      'The CustomResourceDefinition kafkachannels.messaging.knative.dev could not be read, ' +
        'so this channel implementation cannot be shown.'
    );
    expect(shown).toBeUndefined();
  });

  it('says so when the CRD in the URL does not carry the label', () => {
    context.crd = 'pingsources.sources.knative.dev';
    context.crdResult = [
      { metadata: { name: 'pingsources.sources.knative.dev', labels: {} } },
      null,
    ];
    const { text, shown } = renderDetail();

    expect(text).toBe(
      'The CustomResourceDefinition pingsources.sources.knative.dev does not define channel ' +
        'implementations, so this channel implementation cannot be shown.'
    );
    expect(shown).toBeUndefined();
  });

  it('does not show a labelled CRD that is left out', () => {
    context.crd = 'channels.messaging.knative.dev';
    context.crdResult = [
      {
        metadata: {
          name: 'channels.messaging.knative.dev',
          labels: { 'messaging.knative.dev/subscribable': 'true' },
        },
      },
      null,
    ];
    const { text, shown } = renderDetail();

    expect(text).toBe(
      'The CustomResourceDefinition channels.messaging.knative.dev does not define channel ' +
        'implementations, so this channel implementation cannot be shown.'
    );
    expect(shown).toBeUndefined();
  });

  it('says so when the CRD serves no version', () => {
    const versions = kafkaCrd.spec.versions.map(version => ({ ...version, served: false }));
    context.crdResult = [
      {
        metadata: kafkaCrd.metadata,
        jsonData: { ...kafkaCrd, spec: { ...kafkaCrd.spec, versions } },
      },
      null,
    ];
    const { text, shown } = renderDetail();

    expect(text).toBe(
      'The CustomResourceDefinition kafkachannels.messaging.knative.dev serves no version, so ' +
        'this channel implementation cannot be shown.'
    );
    expect(shown).toBeUndefined();
  });

  it('says so, without reading any CRD, when the link names no CRD', () => {
    context.crd = '';
    const { text, shown } = renderDetail();

    expect(text).toBe(
      'The link names no CustomResourceDefinition, so this channel implementation cannot be shown.'
    );
    expect(context.gets).toEqual([]);
    expect(shown).toBeUndefined();
  });
});
