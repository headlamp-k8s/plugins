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

import { type FormSection, FormTextField } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { KnativeBroker } from '../../resources/knative';
import { isNullable } from '../../utils/nullable';
import { deliveryFormSection } from '../common/deliveryFormSection';
import { destinationFormField } from '../common/DestinationField';
import { asRecord, draftNamespace } from '../common/formValues';
import { metadataFormSection } from '../common/metadataFormSection';
import { ResourceNameField } from '../common/ResourceNameField';
import { FilterAttributesField, isValidFilter } from './FilterAttributesField';

/**
 * Tells whether a Trigger names its Broker the way Knative requires: in `spec.broker` or in
 * `spec.brokerRef`, which the YAML editor can set, but not in both.
 *
 * @param broker - The value of `spec.broker`.
 * @param resource - The Trigger being written.
 * @returns True when exactly one of the two is set.
 */
export function namesOneBroker(broker: unknown, resource: Record<string, unknown>): boolean {
  const hasBroker = typeof broker === 'string' && broker !== '';
  const hasBrokerRef = !isNullable(asRecord(resource.spec).brokerRef);
  return hasBroker !== hasBrokerRef;
}

/** Props for {@link BrokerNameField}. */
interface BrokerNameFieldProps {
  /** The Broker's name as the Trigger holds it. */
  value: unknown;
  /** Replaces the name. */
  onChange: (name: string) => void;
  /** The Trigger's namespace, whose Brokers are offered. */
  namespace: string;
  /** The cluster whose Brokers are offered. */
  cluster: string;
}

/**
 * The Broker input of the Trigger form: it offers the Brokers in the Trigger's namespace once the
 * namespace is set, and takes any name.
 *
 * @param props - The name, how to replace it, and where to look.
 * @returns The input.
 */
function BrokerNameField({ value, onChange, namespace, cluster }: BrokerNameFieldProps) {
  const name = typeof value === 'string' ? value : '';
  if (namespace === '') {
    return (
      <FormTextField
        value={name}
        onChange={event => onChange(event.target.value)}
        inputProps={{ 'aria-label': 'Broker' }}
      />
    );
  }
  return (
    <ResourceNameField
      resourceClass={KnativeBroker}
      namespace={namespace}
      cluster={cluster}
      value={name}
      onChange={onChange}
      label="Broker"
    />
  );
}

/**
 * Builds the sections of the Trigger form: metadata; the Broker, the filter attributes and the
 * subscriber, which `kn trigger create` takes; and delivery settings.
 *
 * @param cluster - The cluster whose Brokers and objects the form offers.
 * @returns The sections.
 */
export function triggerFormSections(cluster: string): FormSection[] {
  return [
    metadataFormSection(),
    {
      title: 'Trigger',
      fields: [
        {
          key: 'broker',
          path: 'spec.broker',
          label: 'Broker',
          required: true,
          validate: namesOneBroker,
          helperText:
            "The Broker in the Trigger's namespace that the Trigger takes events from. It " +
            'cannot be changed later.',
          render: ({ value, onChange, resource }) => (
            <BrokerNameField
              value={value}
              onChange={onChange}
              namespace={draftNamespace(resource)}
              cluster={cluster}
            />
          ),
        },
        {
          key: 'filter',
          path: 'spec.filter',
          label: 'Filter',
          validate: isValidFilter,
          helperText:
            'CloudEvents attributes that events must match exactly; an empty value matches any ' +
            'event that has the attribute, and no attributes let every event through. For ' +
            'prefix, suffix or CloudEvents SQL filters, set spec.filters in the YAML editor.',
          render: ({ value, onChange }) => (
            <FilterAttributesField value={value} onChange={onChange} />
          ),
        },
        destinationFormField({
          key: 'subscriber',
          path: 'spec.subscriber',
          label: 'Subscriber',
          cluster,
          required: true,
          helperText: 'Where the Trigger sends the events that pass the filter.',
        }),
      ],
    },
    deliveryFormSection(cluster),
  ];
}
