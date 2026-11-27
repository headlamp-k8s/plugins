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

import { Icon } from '@iconify/react';
import { Activity } from '@kinvolk/headlamp-plugin/lib';
import {
  ActionButton,
  AuthVisible,
  CreateResourceForm,
  EditorDialog,
  type FormSection,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { get } from 'lodash';
import React from 'react';
import { parseAllDocuments } from 'yaml';
import { useClusters } from '../../hooks/useClusters';
import { isNullable } from '../../utils/nullable';

/** A resource being written in a create form, in which any field may still be missing. */
export type ResourceDraft = Record<string, unknown>;

/** Props for {@link CreateFormButton}. */
export interface CreateFormButtonProps {
  /** The class of the resource to create. */
  resourceClass: KubeObjectClass;
  /**
   * Builds the sections of the form in the dialog's Form tab, for the cluster the resource is
   * created in, whose objects the form's lookups offer.
   */
  sections: (cluster: string) => FormSection[];
}

/**
 * Tells whether a value counts as filled in for a required field without its own check, as in
 * Headlamp's create form: a list must have an item, and anything else must be set and not empty.
 *
 * @param value - The field's value.
 * @returns True when the value is filled in.
 */
function isFilledIn(value: unknown): boolean {
  return Array.isArray(value) ? value.length > 0 : !isNullable(value) && value !== '';
}

/**
 * Tells whether a create form's fields accept a resource: a field with a check must pass it, and a
 * required field without one must be filled in. Headlamp releases check only the required fields,
 * so the dialog works this out itself to give the same result on every Headlamp version.
 *
 * @param sections - The form's sections.
 * @param resource - The resource being written.
 * @returns True when every field accepts its value.
 */
export function isFormValid(sections: FormSection[], resource: ResourceDraft): boolean {
  return sections
    .flatMap(section => section.fields)
    .every(field => {
      const value: unknown = get(resource, field.path);
      return field.validate
        ? field.validate(value, resource)
        : !field.required || isFilledIn(value);
    });
}

/**
 * Reads the YAML editor's text as a resource for the form. Empty documents, such as the one after a
 * trailing `---`, are skipped.
 *
 * @param text - The editor's text.
 * @returns The resource, an empty object for blank text, or undefined while the text is not a
 * single YAML mapping, so that the form keeps its fields during an unfinished edit.
 */
export function parseDraft(text: string): ResourceDraft | undefined {
  if (!text.trim()) {
    return {};
  }
  const documents = parseAllDocuments(text);
  if (documents.some(document => document.errors.length > 0)) {
    return undefined;
  }
  try {
    const values = documents
      .map((document): unknown => document.toJS())
      .filter(value => !isNullable(value));
    return values.length === 1 && isDraft(values[0]) ? values[0] : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Tells whether a parsed YAML value is a mapping.
 *
 * @param value - The parsed value.
 * @returns True for an object that is not an array.
 */
function isDraft(value: unknown): value is ResourceDraft {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Props for {@link CreateFormDialog}. */
interface CreateFormDialogProps extends CreateFormButtonProps {
  /** The clusters selected when the dialog opened; the first is the default target. */
  clusters: string[];
  /** The ID of the dialog's activity, whose header names the target cluster. */
  activityId: string;
  /** Closes the dialog's activity. */
  onClose: () => void;
}

/**
 * The create dialog: Headlamp's editor with the form in a Form tab, kept in sync both ways, and a
 * choice among the clusters selected when it opened. It keeps those clusters while the user
 * navigates elsewhere, since its activity stays open.
 *
 * @param props - The resource class, its form sections, the clusters, and the dialog's activity.
 * @returns The dialog.
 */
function CreateFormDialog({
  resourceClass,
  sections: buildSections,
  clusters,
  activityId,
  onClose,
}: CreateFormDialogProps) {
  const initialItem = React.useMemo(() => resourceClass.getBaseObject(), [resourceClass]);
  const [item, setItem] = React.useState<ResourceDraft>(initialItem);
  const [formResource, setFormResource] = React.useState<ResourceDraft>(initialItem);
  const [cluster, setCluster] = React.useState(clusters[0]);
  const sections = React.useMemo(() => buildSections(cluster), [buildSections, cluster]);
  const clusterLabelId = React.useId();

  /**
   * Makes a cluster the target, and names it in the activity's header.
   *
   * @param name - The cluster.
   */
  function chooseCluster(name: string) {
    setCluster(name);
    Activity.update(activityId, { cluster: name });
  }

  /**
   * Takes an edit from the form into the form and the YAML editor.
   *
   * @param resource - The edited resource.
   */
  function handleFormChange(resource: ResourceDraft) {
    setFormResource(resource);
    setItem(resource);
  }

  /**
   * Takes an edit from the YAML editor into the form, once the text is a YAML mapping.
   *
   * @param text - The editor's text.
   */
  function handleEditorChanged(text: string) {
    const draft = parseDraft(text);
    if (draft !== undefined) {
      setFormResource(draft);
    }
  }

  const title = `Create ${resourceClass.kind}`;

  return (
    <EditorDialog
      noDialog
      open
      item={item}
      setOpen={() => {}}
      onClose={onClose}
      cluster={cluster}
      title={title}
      aria-label={title}
      saveLabel="Apply"
      onEditorChanged={handleEditorChanged}
      treatItemChangesAsEdits
      formInvalid={!isFormValid(sections, formResource)}
      formContent={
        <CreateResourceForm
          sections={sections}
          resource={formResource}
          onChange={handleFormChange}
        />
      }
      actions={
        clusters.length > 1
          ? [
              <FormControl key="cluster" size="small">
                <InputLabel id={clusterLabelId}>Cluster</InputLabel>
                <Select
                  labelId={clusterLabelId}
                  label="Cluster"
                  value={cluster}
                  onChange={event => chooseCluster(event.target.value)}
                >
                  {clusters.map(name => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>,
            ]
          : []
      }
    />
  );
}

/**
 * A list header button that opens Headlamp's create dialog for a Knative resource, with a form
 * next to the YAML editor. It shows only to users who may create the kind, like Headlamp's own
 * create button.
 *
 * @param props - The resource class and its form sections.
 * @returns The button, or nothing when no cluster is selected or the user may not create the
 * kind.
 */
export function CreateFormButton({ resourceClass, sections }: CreateFormButtonProps) {
  const clusters = useClusters();
  if (clusters.length === 0) {
    return null;
  }

  const activityId = `knative-create-${resourceClass.apiName}`;
  const label = `Create ${resourceClass.kind}`;

  /** Opens the create dialog as a full-size activity. */
  function openDialog() {
    Activity.launch({
      id: activityId,
      title: label,
      location: 'full',
      cluster: clusters[0],
      icon: <Icon icon="mdi:plus-circle" />,
      content: (
        <CreateFormDialog
          resourceClass={resourceClass}
          sections={sections}
          clusters={clusters}
          activityId={activityId}
          onClose={() => Activity.close(activityId)}
        />
      ),
    });
  }

  return (
    <AuthVisible item={resourceClass} authVerb="create" cluster={clusters[0]}>
      <ActionButton
        color="primary"
        description={label}
        icon="mdi:plus-circle"
        onClick={openDialog}
      />
    </AuthVisible>
  );
}
