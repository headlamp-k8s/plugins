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

import { type FormSection } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Autocomplete, TextField } from '@mui/material';
import { omit } from 'lodash';
import React from 'react';
import { BROKER_CLASS_ANNOTATION } from '../../resources/knative/eventingData';
import { deliveryFormSection } from '../common/deliveryFormSection';
import { asRecord, stringAt } from '../common/formValues';
import { metadataFormSection } from '../common/metadataFormSection';

const BROKER_CLASSES = ['MTChannelBasedBroker', 'Kafka', 'KafkaNamespaced'];

/** Props for {@link BrokerClassField}. */
interface BrokerClassFieldProps {
  /** The Broker's annotations, which hold its class. */
  value: unknown;
  /** Replaces the annotations; undefined removes them. */
  onChange: (annotations: Record<string, unknown> | undefined) => void;
}

/**
 * Edits the Broker's class annotation, offering the classes of Knative's own Brokers and taking
 * any other. Left empty, the annotation is not written and Knative applies the cluster's default
 * class. Other annotations are kept.
 *
 * @param props - The annotations and how to replace them.
 * @returns The class input.
 */
function BrokerClassField({ value, onChange }: BrokerClassFieldProps) {
  const annotations = asRecord(value);
  const brokerClass = stringAt(annotations, BROKER_CLASS_ANNOTATION);

  /**
   * Writes the class, or removes it when empty.
   *
   * @param next - The class.
   */
  function setClass(next: string) {
    const others = omit(annotations, BROKER_CLASS_ANNOTATION);
    const updated = next === '' ? others : { ...others, [BROKER_CLASS_ANNOTATION]: next };
    onChange(Object.keys(updated).length > 0 ? updated : undefined);
  }

  return (
    <Autocomplete
      freeSolo
      options={BROKER_CLASSES}
      value={brokerClass}
      onChange={(_event, next) => setClass(next ?? '')}
      onInputChange={(_event, next, reason) => {
        if (reason === 'input') {
          setClass(next);
        }
      }}
      renderInput={params => (
        <TextField
          {...params}
          variant="outlined"
          size="small"
          fullWidth
          placeholder="Cluster default"
          InputProps={{
            ...params.InputProps,
            sx: theme => ({ background: theme.palette.background.default }),
          }}
          inputProps={{ ...params.inputProps, 'aria-label': 'Class' }}
        />
      )}
    />
  );
}

/**
 * Builds the sections of the Broker form: metadata, the class, and delivery settings for every
 * Trigger of the Broker, the settings `kn broker create` takes.
 *
 * @param cluster - The cluster whose objects the dead letter sink offers.
 * @returns The sections.
 */
export function brokerFormSections(cluster: string): FormSection[] {
  return [
    metadataFormSection(),
    {
      title: 'Broker',
      fields: [
        {
          key: 'class',
          path: 'metadata.annotations',
          label: 'Class',
          helperText:
            'The eventing.knative.dev/broker.class annotation. Leave it empty for the default ' +
            'class in config-br-defaults; another class needs its Broker installed.',
          render: ({ value, onChange }) => <BrokerClassField value={value} onChange={onChange} />,
        },
      ],
    },
    deliveryFormSection(cluster),
  ];
}
