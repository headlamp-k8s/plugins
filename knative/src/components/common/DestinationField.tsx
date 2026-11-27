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
import { type FormField, FormTextField } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, MenuItem } from '@mui/material';
import { omit, pick } from 'lodash';
import { KnativeBroker, KnativeChannel, KService } from '../../resources/knative';
import { isNullable } from '../../utils/nullable';
import { asRecord, draftNamespace, isAbsoluteUri, isRelativeUri, stringAt } from './formValues';
import { type NameListingClass, ResourceNameField } from './ResourceNameField';

/** A kind of object that a destination can point to, picked by its label in the form. */
interface DestinationKind {
  /** The label shown in the form. */
  label: string;
  /** The API version written to `ref.apiVersion`. */
  apiVersion: string;
  /** The kind written to `ref.kind`. */
  kind: string;
  /** The class that lists the objects of the kind. */
  resourceClass: NameListingClass;
}

const DESTINATION_KINDS: DestinationKind[] = [
  {
    label: 'Knative Service',
    apiVersion: 'serving.knative.dev/v1',
    kind: 'Service',
    resourceClass: KService,
  },
  {
    label: 'Kubernetes Service',
    apiVersion: 'v1',
    kind: 'Service',
    resourceClass: K8s.ResourceClasses.Service,
  },
  {
    label: 'Broker',
    apiVersion: 'eventing.knative.dev/v1',
    kind: 'Broker',
    resourceClass: KnativeBroker,
  },
  {
    label: 'Channel',
    apiVersion: 'messaging.knative.dev/v1',
    kind: 'Channel',
    resourceClass: KnativeChannel,
  },
];

const URL_TARGET = 'url';

/**
 * Builds the value that identifies a kind in the target select.
 *
 * @param apiVersion - The kind's API version.
 * @param kind - The kind.
 * @returns `apiVersion/kind`.
 */
function kindKey(apiVersion: string, kind: string): string {
  return `${apiVersion}/${kind}`;
}

/**
 * Tells whether a destination is complete, by the rules Knative's webhook applies: an object
 * reference with an API version, kind and name, which a relative URI may extend; or an absolute
 * URI with a host. Either URI must be one that Go's `net/url`, which Knative uses, can read.
 *
 * @param value - The destination as the resource holds it.
 * @param optional - Whether the destination may be missing.
 * @returns True when the destination is complete, or missing and optional.
 */
export function isValidDestination(value: unknown, optional: boolean): boolean {
  if (isNullable(value)) {
    return optional;
  }
  const destination = asRecord(value);
  const uri = stringAt(destination, 'uri');
  if (isNullable(destination.ref)) {
    return isAbsoluteUri(uri);
  }
  const ref = asRecord(destination.ref);
  const isRefComplete = ['apiVersion', 'kind', 'name'].every(key => stringAt(ref, key) !== '');
  return isRefComplete && (uri === '' || isRelativeUri(uri));
}

/** Props for {@link DestinationField}. */
export interface DestinationFieldProps {
  /** The destination as the resource holds it, which may be incomplete or missing. */
  value: unknown;
  /** Replaces the destination; undefined removes it. */
  onChange: (value: Record<string, unknown> | undefined) => void;
  /**
   * The namespace of the resource that holds the destination, whose objects are offered when the
   * reference names no namespace of its own.
   */
  namespace: string;
  /** The cluster whose objects are offered. */
  cluster: string;
  /** The destination's label, read by screen readers. */
  label: string;
  /** Whether the destination may be left out. */
  optional?: boolean;
}

/**
 * Edits a Knative destination, such as a Trigger's subscriber or a dead letter sink: a Knative
 * Service, Kubernetes Service, Broker or Channel picked by name, as `kn` offers, or a URL, in a
 * row of labelled inputs like the rows of Headlamp's own forms. A
 * reference to another kind, set in the YAML, keeps its kind and takes its name as typed. Fields
 * the form does not show, such as `CACerts` and `audience`, are kept.
 *
 * @param props - The destination, where to look up names, the label, and whether it is optional.
 * @returns The target select and the name or URL input.
 */
export function DestinationField({
  value,
  onChange,
  namespace,
  cluster,
  label,
  optional,
}: DestinationFieldProps) {
  const destination = asRecord(value);
  const hasRef = !isNullable(destination.ref);
  const ref = asRecord(destination.ref);
  const refKey = kindKey(stringAt(ref, 'apiVersion'), stringAt(ref, 'kind'));
  const knownKind = hasRef
    ? DESTINATION_KINDS.find(kind => kindKey(kind.apiVersion, kind.kind) === refKey)
    : undefined;
  const target = hasRef ? refKey : 'uri' in destination ? URL_TARGET : '';
  const uri = stringAt(destination, 'uri');
  const name = stringAt(ref, 'name');
  const lookupNamespace = stringAt(ref, 'namespace') || namespace;

  /**
   * Switches the destination to another kind, keeping the reference's namespace, or to a URL.
   *
   * @param next - The select's new value.
   */
  function handleTargetChange(next: string) {
    if (next === '') {
      onChange(undefined);
      return;
    }
    if (next === URL_TARGET) {
      onChange({ ...omit(destination, 'ref'), uri });
      return;
    }
    const kind = DESTINATION_KINDS.find(option => kindKey(option.apiVersion, option.kind) === next);
    if (kind && next !== refKey) {
      onChange({
        ...omit(destination, ['ref', 'uri']),
        ref: { apiVersion: kind.apiVersion, kind: kind.kind, ...pick(ref, 'namespace') },
      });
    }
  }

  /**
   * Sets the referenced object's name, keeping the rest of the reference.
   *
   * @param nextName - The name.
   */
  function handleNameChange(nextName: string) {
    onChange({
      ...destination,
      ref: nextName === '' ? omit(ref, 'name') : { ...ref, name: nextName },
    });
  }

  const isUriInvalid = target === URL_TARGET && uri !== '' && !isAbsoluteUri(uri);

  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start', mt: 2 }}>
      <Box sx={{ width: 200, flexShrink: 0 }}>
        <FormTextField
          select
          label="Type"
          value={target}
          onChange={event => handleTargetChange(event.target.value)}
          inputProps={{ 'aria-label': `${label} type` }}
        >
          {optional && <MenuItem value="">Not set</MenuItem>}
          {DESTINATION_KINDS.map(kind => (
            <MenuItem
              key={kindKey(kind.apiVersion, kind.kind)}
              value={kindKey(kind.apiVersion, kind.kind)}
            >
              {kind.label}
            </MenuItem>
          ))}
          {hasRef && !knownKind && (
            <MenuItem value={refKey}>
              {`${stringAt(ref, 'kind')} (${stringAt(ref, 'apiVersion')})`}
            </MenuItem>
          )}
          <MenuItem value={URL_TARGET}>URL</MenuItem>
        </FormTextField>
      </Box>
      {target === URL_TARGET && (
        <FormTextField
          label="URL"
          value={uri}
          placeholder="https://example.com/events"
          error={isUriInvalid}
          helperText={
            isUriInvalid
              ? 'Enter a valid absolute URL, such as https://example.com/events.'
              : undefined
          }
          onChange={event => onChange({ ...destination, uri: event.target.value })}
          inputProps={{ 'aria-label': `${label} URL` }}
        />
      )}
      {hasRef && knownKind && lookupNamespace !== '' && (
        <ResourceNameField
          key={refKey}
          resourceClass={knownKind.resourceClass}
          namespace={lookupNamespace}
          cluster={cluster}
          value={name}
          onChange={handleNameChange}
          label={`${label} name`}
          fieldLabel="Name"
        />
      )}
      {hasRef && (!knownKind || lookupNamespace === '') && (
        <FormTextField
          label="Name"
          value={name}
          onChange={event => handleNameChange(event.target.value)}
          inputProps={{ 'aria-label': `${label} name` }}
        />
      )}
    </Box>
  );
}

/** Options for {@link destinationFormField}. */
export interface DestinationFormFieldOptions {
  /** The field's unique key in the form. */
  key: string;
  /** Where the destination sits in the resource, such as `spec.subscriber`. */
  path: string;
  /** The field's label. */
  label: string;
  /** The cluster whose objects the name offers. */
  cluster: string;
  /** Whether the resource needs the destination. */
  required?: boolean;
  /** Help shown in the label's tooltip. */
  helperText?: string;
}

/**
 * Builds a form field for Headlamp's `CreateResourceForm` that edits a destination with
 * {@link DestinationField} and is valid only when Knative would accept the destination.
 *
 * @param options - Where the destination sits, its label, the cluster, and whether it is required.
 * @returns The form field.
 */
export function destinationFormField(options: DestinationFormFieldOptions): FormField {
  const { key, path, label, cluster, required = false, helperText } = options;
  return {
    key,
    path,
    label,
    required,
    helperText,
    validate: value => isValidDestination(value, !required),
    render: ({ value, onChange, resource }) => (
      <DestinationField
        value={value}
        onChange={onChange}
        namespace={draftNamespace(resource)}
        cluster={cluster}
        label={label}
        optional={!required}
      />
    ),
  };
}
