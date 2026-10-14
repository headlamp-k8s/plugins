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

import { KnativeBroker, type KnativeTrigger } from '../../resources/knative';
import { OwnerLink } from '../common/OwnerLink';

/**
 * Shows the Broker a Trigger takes events from.
 *
 * @param props - The Trigger whose Broker is shown.
 * @returns A link to the Broker named in `spec.broker` or `spec.brokerRef`, or an empty value when
 * neither is set.
 */
export function BrokerLink({
  trigger,
}: {
  /** The Trigger to show. */
  trigger: KnativeTrigger;
}) {
  const broker = trigger.broker;
  const owner = broker
    ? { apiVersion: KnativeBroker.apiVersion, kind: KnativeBroker.kind, name: broker.name }
    : undefined;

  return (
    <OwnerLink
      owner={owner}
      namespace={broker?.namespace || trigger.metadata.namespace}
      cluster={trigger.cluster}
    />
  );
}
