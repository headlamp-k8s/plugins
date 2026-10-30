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

import type { NameValueTableRow } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { DeliverySpec } from '../../resources/knative/common';
import { DestinationLink } from './DestinationLink';
import { TextValue } from './ResourceListCells';

/**
 * Builds the detail rows for delivery settings as they are written, such as how often an event is
 * retried and where it goes when every attempt fails. Settings that are not set are hidden.
 *
 * @param delivery - The delivery settings.
 * @param deadLetterSinkUri - The URI Knative resolved the dead letter sink to.
 * @param namespace - Namespace of the resource that holds the settings; a dead letter sink without
 * one is in this namespace.
 * @param cluster - Cluster of the resource that holds the settings.
 * @returns One row per delivery setting.
 */
export function getDeliveryRows(
  delivery: DeliverySpec | undefined,
  deadLetterSinkUri: string | undefined,
  namespace: string | undefined,
  cluster: string | undefined
): NameValueTableRow[] {
  return [
    {
      name: 'Retry',
      value: <TextValue value={delivery?.retry} />,
      hide: delivery?.retry === undefined,
    },
    {
      name: 'Backoff Policy',
      value: <TextValue value={delivery?.backoffPolicy} />,
      hide: !delivery?.backoffPolicy,
    },
    {
      name: 'Backoff Delay',
      value: <TextValue value={delivery?.backoffDelay} />,
      hide: !delivery?.backoffDelay,
    },
    {
      name: 'Timeout',
      value: <TextValue value={delivery?.timeout} />,
      hide: !delivery?.timeout,
    },
    {
      name: 'Retry-After Max',
      value: <TextValue value={delivery?.retryAfterMax} />,
      hide: !delivery?.retryAfterMax,
    },
    {
      name: 'Format',
      value: <TextValue value={delivery?.format} />,
      hide: !delivery?.format,
    },
    {
      name: 'Dead Letter Sink',
      value: (
        <DestinationLink
          destination={delivery?.deadLetterSink}
          namespace={namespace}
          cluster={cluster}
        />
      ),
      hide: !delivery?.deadLetterSink,
    },
    {
      name: 'Dead Letter Sink URI',
      value: <TextValue value={deadLetterSinkUri} />,
      hide: !deadLetterSinkUri,
    },
  ];
}
