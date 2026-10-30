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

import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { EmptyContent, Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useLocation } from 'react-router-dom';
import { CustomResourceDefinition } from '../../resources/k8s/customResourceDefinition';
import {
  CHANNEL_CRD_LABEL_KEY,
  GENERIC_CHANNEL_CRD_NAME,
  getKnativeChannelImplementationClass,
  getKnativeCrdName,
} from '../../resources/knative';
import type { KnativeResourceClass } from '../../resources/knative/customResourceLinks';
import {
  getCrdKindInfo,
  KNATIVE_CHANNEL_IMPLEMENTATION_KINDS,
  toYaml,
} from '../../resources/knative/eventingData';
import { ChannelSubscribers } from '../channels/ChannelSubscribers';
import { getDeliveryRows } from '../common/DeliveryRows';
import { EventingResourceDetail } from '../common/EventingResourceDetail';
import { ReadOnlyYaml } from '../common/ReadOnlyYaml';
import { TextValue } from '../common/ResourceListCells';

/**
 * Shows one channel implementation of a known kind: its kind, address, delivery settings, the
 * settings of its own kind, and its Subscriptions.
 *
 * @param props - The kind of the channel.
 * @returns The detail page.
 */
function ChannelImplementationPage({
  info,
}: {
  /** The kind, its plural name, scope and the API version to request. */
  info: KnativeResourceClass;
}) {
  return (
    <EventingResourceDetail
      resourceType={getKnativeChannelImplementationClass(info)}
      extraInfo={channel => {
        const { settings } = channel;
        return [
          { name: 'Kind', value: <TextValue value={info.kind} /> },
          { name: 'Address', value: <TextValue value={channel.address} /> },
          ...getDeliveryRows(
            channel.spec?.delivery,
            channel.status?.deadLetterSinkUri,
            channel.getNamespace(),
            channel.cluster
          ),
          {
            name: 'Settings',
            value: settings && (
              <ReadOnlyYaml value={toYaml(settings)} ariaLabel={`${info.kind} settings YAML`} />
            ),
            valueFullRow: true,
            hide: !settings,
          },
        ];
      }}
      extraSections={channel => [
        {
          id: 'knative.channel-implementation-subscriptions',
          section: <ChannelSubscribers channel={channel} />,
        },
      ]}
    />
  );
}

/**
 * Explains why a channel's page cannot be shown.
 *
 * @param props - What is wrong.
 * @returns The message.
 */
function ChannelImplementationProblem({
  children,
}: {
  /** What is wrong, as one sentence. */
  children: string;
}) {
  return <EmptyContent color="error">{children}</EmptyContent>;
}

/**
 * Shows one channel implementation of the kind a CRD defines, once the CRD is read.
 *
 * @param props - The CRD that defines the channel's kind.
 * @returns The detail page, or a message when the CRD cannot be read, serves no version or is not
 * a channel implementation.
 */
function ChannelImplementationOfCrd({
  crd,
}: {
  /** Name of the CRD, such as `kafkachannels.messaging.knative.dev`. */
  crd: string;
}) {
  const cluster = K8s.useCluster();
  const [crdObject, error] = CustomResourceDefinition.useGet(crd, undefined, {
    cluster: cluster ?? undefined,
  });
  const problem = (reason: string) => (
    <ChannelImplementationProblem>
      {`The CustomResourceDefinition ${crd} ${reason}, so this channel cannot be shown.`}
    </ChannelImplementationProblem>
  );

  if (!crdObject) {
    if (!error) return <Loader title="Loading the channel's CustomResourceDefinition" />;
    const knativeChannel = KNATIVE_CHANNEL_IMPLEMENTATION_KINDS.find(
      kind => getKnativeCrdName(kind) === crd
    );
    return knativeChannel ? (
      <ChannelImplementationPage info={knativeChannel} />
    ) : (
      problem('could not be read')
    );
  }

  const isChannelImplementation =
    crd !== GENERIC_CHANNEL_CRD_NAME &&
    crdObject.metadata.labels?.[CHANNEL_CRD_LABEL_KEY] === 'true';
  if (!isChannelImplementation) return problem('is not a channel implementation');

  const info = getCrdKindInfo(crdObject.jsonData);
  return info ? <ChannelImplementationPage info={info} /> : problem('serves no version');
}

/**
 * Shows one channel implementation of any kind, such as a KafkaChannel or a NatsJetStreamChannel.
 * It reads the channel's CRD, named in the URL's `crd` query parameter, to know the kind; where the
 * CRD cannot be read it still shows Knative's own InMemoryChannel.
 *
 * @returns The detail page, or a message when the URL names no CRD or the CRD cannot be used.
 */
export function ChannelImplementationDetail() {
  const crd = new URLSearchParams(useLocation().search).get('crd');

  if (!crd) {
    return (
      <ChannelImplementationProblem>
        The link names no CustomResourceDefinition, so this channel cannot be shown.
      </ChannelImplementationProblem>
    );
  }
  return <ChannelImplementationOfCrd crd={crd} />;
}
