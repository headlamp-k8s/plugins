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

import { Link, type ResourceTableColumn } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { KubeObject, KubeOwnerReference } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { CustomResourceDefinition } from '../../resources/k8s/customResourceDefinition';
import {
  CHANNEL_API_GROUP,
  CHANNEL_CRD_LABEL_SELECTOR,
  GENERIC_CHANNEL_CRD_NAME,
  getKnativeCrdName,
  KnativeBroker,
  KnativeCertificate,
  KnativeChannel,
  KnativeChannelImplementation,
  KnativeConfiguration,
  KnativeImage,
  KnativeIngress,
  KnativeMetric,
  KnativePodAutoscaler,
  KnativeRoute,
  KnativeServerlessService,
  KnativeSubscription,
  KnativeTrigger,
} from '../../resources/knative';
import { KNATIVE_CHANNEL_IMPLEMENTATION_KINDS } from '../../resources/knative/eventingData';
import { EmptyValue, TextValue } from './ResourceListCells';

const ownerResourceClasses = [
  KnativeBroker,
  KnativeConfiguration,
  KnativeRoute,
  KnativePodAutoscaler,
  KnativeMetric,
  KnativeImage,
  KnativeIngress,
  KnativeServerlessService,
  KnativeCertificate,
  KnativeChannel,
  KnativeSubscription,
  KnativeTrigger,
];

const ownerClassesByGvk = ownerResourceClasses.flatMap(resourceClass =>
  (Array.isArray(resourceClass.apiVersion)
    ? resourceClass.apiVersion
    : [resourceClass.apiVersion]
  ).map(apiVersion => [`${apiVersion}/${resourceClass.kind}`, resourceClass] as const)
);

const ownerCrdNames = new Map(
  ownerClassesByGvk.map(([gvk, resourceClass]) => [gvk, getKnativeCrdName(resourceClass)] as const)
);

const ownerRouteNames = new Map<string, string>([
  ['serving.knative.dev/v1/Service', 'kserviceDetails'],
  ['serving.knative.dev/v1/Revision', 'revisionDetails'],
  ...ownerClassesByGvk
    .filter(([, resourceClass]) => resourceClass.detailsRoute !== resourceClass.kind)
    .map(([gvk, resourceClass]) => [gvk, resourceClass.detailsRoute] as const),
  ['v1/Service', 'Service'],
  ['v1/Secret', 'Secret'],
  ['v1/ConfigMap', 'ConfigMap'],
]);

/** The parts of an object reference needed to link to the object. */
type ResourceReference = Pick<KubeOwnerReference, 'apiVersion' | 'kind' | 'name'>;

/**
 * Finds the CRD name of a Knative kind that the plugin links to Headlamp's Custom Resource view.
 *
 * @param owner - The referenced object.
 * @returns The CRD name, for example `routes.serving.knative.dev`, or undefined for other kinds.
 */
function getOwnerCrdName(owner: ResourceReference): string | undefined {
  return ownerCrdNames.get(`${owner.apiVersion}/${owner.kind}`);
}

/**
 * Links to a channel implementation's page, which names the channel's CRD in its query.
 *
 * @param props - The channel, its CRD, where it is, and the text to show.
 * @returns The link.
 */
function ChannelImplementationPageLink({
  name,
  crd,
  namespace,
  cluster,
  text,
}: {
  /** Name of the channel. */
  name: string;
  /** Name of the channel's CRD, such as `kafkachannels.messaging.knative.dev`. */
  crd: string;
  /** Namespace of the channel; `default` when it is not set. */
  namespace?: string;
  /** Cluster of the channel. */
  cluster?: string;
  /** Text to show. */
  text: string;
}) {
  return (
    <Link
      routeName={KnativeChannelImplementation.detailsRoute}
      params={{ namespace: namespace || 'default', name }}
      search={{ crd }}
      activeCluster={cluster}
    >
      {text}
    </Link>
  );
}

/**
 * Links to a channel implementation of another project, such as a KafkaChannel or a
 * NatsJetStreamChannel, using the channel CRD in the cluster that defines its kind. It lists the
 * cluster's channel CRDs, so it is rendered only for `messaging.knative.dev` kinds the plugin
 * does not know.
 *
 * @param props - The object to link to, where it is, and the text to show.
 * @returns A link to the channel's page, or the text while the CRDs load, when they cannot be
 * listed, or when no channel CRD defines the kind.
 */
function ChannelImplementationLink({
  owner,
  namespace,
  cluster,
  text,
}: {
  /** The object to link to. */
  owner: ResourceReference;
  /** Namespace of the object; `default` when it is not set. */
  namespace?: string;
  /** Cluster of the object. */
  cluster?: string;
  /** Text to show. */
  text: string;
}) {
  const [crds] = CustomResourceDefinition.useList({
    cluster,
    labelSelector: CHANNEL_CRD_LABEL_SELECTOR,
  });
  const crd = crds?.find(
    item =>
      item.metadata.name !== GENERIC_CHANNEL_CRD_NAME &&
      item.jsonData.spec.group === CHANNEL_API_GROUP &&
      item.jsonData.spec.names.kind === owner.kind
  );
  if (!crd) return <TextValue value={text} />;

  return (
    <ChannelImplementationPageLink
      name={owner.name}
      crd={crd.metadata.name}
      namespace={namespace}
      cluster={cluster}
      text={text}
    />
  );
}

/**
 * Links to a referenced object: the plugin's pages for Knative Services and Revisions, for the
 * Knative kinds whose class names its own detail route, and for channel implementations such as a
 * KafkaChannel, Headlamp's pages for Services, Secrets and ConfigMaps, and Headlamp's Custom
 * Resource view for the other Knative kinds the plugin knows.
 *
 * @param props - The object to link to, where it is, and the text to show.
 * @returns A link to the object, its name or label as text when it cannot be linked, or an empty
 * value when there is no object.
 */
export function OwnerLink({
  owner,
  namespace,
  cluster,
  label,
}: {
  /** The object to link to. */
  owner?: ResourceReference;
  /** Namespace of the object; `default` when it is not set. */
  namespace?: string;
  /** Cluster of the object. */
  cluster?: string;
  /** Text to show instead of the object's name. */
  label?: string;
}) {
  if (!owner) return <EmptyValue />;

  const text = label || owner.name;

  const routeName = ownerRouteNames.get(`${owner.apiVersion}/${owner.kind}`);
  const crd = routeName ? undefined : getOwnerCrdName(owner);
  if (!routeName && !crd) {
    if (owner.apiVersion.split('/')[0] !== CHANNEL_API_GROUP) return <TextValue value={text} />;
    const knativeChannel = KNATIVE_CHANNEL_IMPLEMENTATION_KINDS.find(
      kind => kind.kind === owner.kind
    );
    return knativeChannel ? (
      <ChannelImplementationPageLink
        name={owner.name}
        crd={getKnativeCrdName(knativeChannel)}
        namespace={namespace}
        cluster={cluster}
        text={text}
      />
    ) : (
      <ChannelImplementationLink
        owner={owner}
        namespace={namespace}
        cluster={cluster}
        text={text}
      />
    );
  }

  return (
    <Link
      routeName={routeName || 'customresource'}
      params={{
        namespace: namespace || 'default',
        ...(crd ? { crd, crName: owner.name } : { name: owner.name }),
      }}
      activeCluster={cluster}
    >
      {text}
    </Link>
  );
}

/**
 * Builds a list column that shows the object that created each row, such as the Trigger a Broker
 * made a Subscription for, or the Channel a KafkaChannel backs.
 *
 * @returns A column that sorts and filters by the owner's name and links to the owner.
 */
export function ownerColumn<
  T extends KubeObject & {
    /** The object that created the row, or undefined when it has none. */
    owner?: ResourceReference;
  }
>(): ResourceTableColumn<T> {
  return {
    id: 'owner',
    label: 'Owner',
    getValue: item => item.owner?.name || '',
    render: item => (
      <OwnerLink owner={item.owner} namespace={item.metadata.namespace} cluster={item.cluster} />
    ),
  };
}
