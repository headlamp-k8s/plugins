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

import type { FormSection } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CreateFormButton,
  type CreateFormButtonProps,
  isFormValid,
  parseDraft,
} from './CreateFormButton';

/** What the test records of an activity the button launches. */
interface LaunchedActivity {
  /** The activity's ID. */
  id: string;
  /** The activity's title. */
  title: string;
  /** Where the activity opens. */
  location: string;
  /** The cluster the activity names. */
  cluster?: string;
  /** What the activity shows. */
  content: React.ReactElement;
}

/** The props of Headlamp's `EditorDialog` that the test reads. */
interface DialogProps {
  /** The object the editor shows. */
  item: unknown;
  /** The cluster the dialog applies to. */
  cluster?: string;
  /** The dialog title. */
  title?: string;
  /** The label of the save button. */
  saveLabel?: string;
  /** Whether form edits count as edits of the item. */
  treatItemChangesAsEdits?: boolean;
  /** Whether the form reports invalid input. */
  formInvalid?: boolean;
  /** The Form tab's content. */
  formContent?: React.ReactNode;
  /** Extra dialog actions. */
  actions?: React.ReactNode[];
  /** Called with the editor's text when it changes. */
  onEditorChanged?: (text: string) => void;
  /** Closes the dialog. */
  onClose: () => void;
}

const state = vi.hoisted(() => ({
  clusters: ['cluster-a'] as string[],
  launched: [] as LaunchedActivity[],
  closed: [] as string[],
  updated: [] as { id: string; cluster?: string }[],
  sectionBuilds: [] as string[],
  auth: [] as { authVerb: string; cluster?: string; kind?: string }[],
  dialog: undefined as DialogProps | undefined,
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  Activity: {
    launch: (activity: LaunchedActivity) => state.launched.push(activity),
    close: (id: string) => state.closed.push(id),
    update: (id: string, diff: { cluster?: string }) =>
      state.updated.push({ id, cluster: diff.cluster }),
  },
}));

vi.mock('../../hooks/useClusters', () => ({
  useClusters: () => state.clusters,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', async () => {
  const { cloneDeep, get, set } = await vi.importActual<typeof import('lodash')>('lodash');
  return {
    CreateResourceForm: ({
      sections,
      resource,
      onChange,
    }: {
      sections: FormSection[];
      resource: Record<string, unknown>;
      onChange: (resource: Record<string, unknown>) => void;
    }) => (
      <div>
        <span>{sections.map(section => section.title).join(', ')}</span>
        {sections
          .flatMap(section => section.fields)
          .map(field => (
            <input
              key={field.key}
              aria-label={field.label}
              value={String(get(resource, field.path) ?? '')}
              onChange={event => onChange(set(cloneDeep(resource), field.path, event.target.value))}
            />
          ))}
      </div>
    ),
    ActionButton: ({ description, onClick }: { description: string; onClick: () => void }) => (
      <button onClick={onClick}>{description}</button>
    ),
    AuthVisible: ({
      authVerb,
      cluster,
      item,
      children,
    }: React.PropsWithChildren<{
      authVerb: string;
      cluster?: string;
      item: { kind?: string };
    }>) => {
      state.auth.push({ authVerb, cluster, kind: item.kind });
      return <>{children}</>;
    },
    EditorDialog: (props: DialogProps) => {
      state.dialog = props;
      const [text, setText] = React.useState('');
      return (
        <div>
          <textarea
            aria-label="Editor"
            value={text}
            onChange={event => {
              setText(event.target.value);
              props.onEditorChanged?.(event.target.value);
            }}
          />
          <div data-testid="form">{props.formContent}</div>
          <div data-testid="actions">{props.actions}</div>
          <button onClick={props.onClose}>Close</button>
        </div>
      );
    },
  };
});

/**
 * A stand-in for the Broker class with the members the button uses.
 *
 * @returns The class stub.
 */
function brokerClass() {
  const stub = {
    kind: 'Broker',
    apiName: 'brokers',
    getBaseObject: (): ReturnType<KubeObjectClass['getBaseObject']> => ({
      apiVersion: 'eventing.knative.dev/v1',
      kind: 'Broker',
      metadata: { name: '' },
    }),
  } satisfies Pick<KubeObjectClass, 'kind' | 'apiName' | 'getBaseObject'>;
  return stub as CreateFormButtonProps['resourceClass'];
}

const KnativeBroker = brokerClass();

/**
 * Builds a form with one required field, the name, in a section titled after the cluster.
 *
 * @param cluster - The cluster the form is built for.
 * @returns The sections.
 */
function nameSections(cluster: string): FormSection[] {
  state.sectionBuilds.push(cluster);
  return [
    {
      title: `form cluster: ${cluster}`,
      fields: [{ key: 'name', path: 'metadata.name', label: 'Name', required: true }],
    },
  ];
}

/**
 * Renders the button under StrictMode, clicks it, and renders the activity it launched.
 *
 * @returns The rendered activity content.
 */
function openDialog() {
  render(
    <React.StrictMode>
      <CreateFormButton resourceClass={KnativeBroker} sections={nameSections} />
    </React.StrictMode>
  );
  fireEvent.click(screen.getByRole('button', { name: 'Create Broker' }));
  const activity = state.launched[state.launched.length - 1];
  return render(<React.StrictMode>{activity.content}</React.StrictMode>);
}

beforeEach(() => {
  state.clusters = ['cluster-a'];
  state.launched = [];
  state.closed = [];
  state.updated = [];
  state.sectionBuilds = [];
  state.auth = [];
  state.dialog = undefined;
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('parseDraft', () => {
  it('reads a YAML mapping, and an empty object from blank text', () => {
    expect(parseDraft('kind: Broker\nmetadata:\n  name: default\n')).toEqual({
      kind: 'Broker',
      metadata: { name: 'default' },
    });
    expect(parseDraft('  \n')).toEqual({});
  });

  it('skips the empty document after a trailing separator', () => {
    expect(parseDraft('kind: Trigger\n---\n')).toEqual({ kind: 'Trigger' });
  });

  it('gives nothing for text that is not a single YAML mapping', () => {
    expect(parseDraft('- a\n- b\n')).toBeUndefined();
    expect(parseDraft('just text')).toBeUndefined();
    expect(parseDraft('kind: [')).toBeUndefined();
    expect(parseDraft('a: 1\n---\nb: 2\n')).toBeUndefined();
  });
});

describe('isFormValid', () => {
  const sections: FormSection[] = [
    {
      title: 'Test',
      fields: [
        { key: 'name', path: 'metadata.name', label: 'Name', required: true },
        { key: 'labels', path: 'metadata.labels', label: 'Labels', type: 'labels' },
        {
          key: 'timeout',
          path: 'spec.timeout',
          label: 'Timeout',
          validate: value => value === undefined || value === 'PT1S',
        },
      ],
    },
  ];

  it('needs the required fields filled in, a list with an item', () => {
    expect(isFormValid(sections, { metadata: { name: 'orders' } })).toBe(true);
    expect(isFormValid(sections, { metadata: { name: '' } })).toBe(false);
    expect(isFormValid(sections, { metadata: { name: [] } })).toBe(false);
    expect(isFormValid(sections, {})).toBe(false);
  });

  it('runs the check of an optional field', () => {
    const metadata = { name: 'orders' };
    expect(isFormValid(sections, { metadata, spec: { timeout: 'PT1S' } })).toBe(true);
    expect(isFormValid(sections, { metadata, spec: { timeout: 'abc' } })).toBe(false);
  });
});

describe('CreateFormButton', () => {
  it('shows nothing when no cluster is selected', () => {
    state.clusters = [];
    const { container } = render(
      <CreateFormButton resourceClass={KnativeBroker} sections={nameSections} />
    );
    expect(container.innerHTML).toBe('');
    expect(state.auth).toEqual([]);
  });

  it('asks whether the user may create the kind in the first cluster', () => {
    state.clusters = ['cluster-a', 'cluster-b'];
    render(<CreateFormButton resourceClass={KnativeBroker} sections={nameSections} />);
    expect(state.auth[0]).toEqual({ authVerb: 'create', cluster: 'cluster-a', kind: 'Broker' });
  });

  it('opens a full-size create dialog that starts from the base object', () => {
    openDialog();
    expect(state.launched[0]).toMatchObject({
      id: 'knative-create-brokers',
      title: 'Create Broker',
      location: 'full',
      cluster: 'cluster-a',
    });
    expect(state.dialog).toMatchObject({
      item: { apiVersion: 'eventing.knative.dev/v1', kind: 'Broker', metadata: { name: '' } },
      cluster: 'cluster-a',
      title: 'Create Broker',
      saveLabel: 'Apply',
      treatItemChangesAsEdits: true,
      formInvalid: true,
    });
    expect(screen.queryByText('form cluster: cluster-a')).not.toBeNull();
  });

  it('puts form edits into the editor and follows the form validity', () => {
    openDialog();
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'orders' } });
    expect(state.dialog?.item).toEqual({
      apiVersion: 'eventing.knative.dev/v1',
      kind: 'Broker',
      metadata: { name: 'orders' },
    });
    expect(state.dialog?.formInvalid).toBe(false);

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: '' } });
    expect(state.dialog?.formInvalid).toBe(true);
  });

  it('puts YAML edits into the form, and keeps the form during unfinished YAML', () => {
    openDialog();
    const editor = screen.getByLabelText('Editor');
    fireEvent.change(editor, { target: { value: 'metadata:\n  name: from-yaml\n' } });
    expect(screen.getByDisplayValue('from-yaml').getAttribute('aria-label')).toBe('Name');
    expect(state.dialog?.formInvalid).toBe(false);

    fireEvent.change(editor, { target: { value: 'metadata:\n  name: [' } });
    expect(screen.getByDisplayValue('from-yaml').getAttribute('aria-label')).toBe('Name');
  });

  it('offers no cluster choice for a single cluster', () => {
    openDialog();
    expect(within(screen.getByTestId('actions')).queryByRole('combobox')).toBeNull();
  });

  it('creates in the chosen cluster and names it in the activity header', () => {
    state.clusters = ['cluster-a', 'cluster-b'];
    openDialog();
    fireEvent.mouseDown(within(screen.getByTestId('actions')).getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'cluster-b' }));
    expect(state.dialog?.cluster).toBe('cluster-b');
    expect(screen.queryByText('form cluster: cluster-b')).not.toBeNull();
    expect(state.updated).toEqual([{ id: 'knative-create-brokers', cluster: 'cluster-b' }]);
  });

  it('builds the form once per cluster, not on every edit', () => {
    state.clusters = ['cluster-a', 'cluster-b'];
    openDialog();
    const builds = state.sectionBuilds.length;
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'orders' } });
    expect(state.sectionBuilds).toHaveLength(builds);

    fireEvent.mouseDown(within(screen.getByTestId('actions')).getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'cluster-b' }));
    const rebuilt = state.sectionBuilds.slice(builds);
    expect(rebuilt.length).toBeGreaterThan(0);
    expect(rebuilt.every(cluster => cluster === 'cluster-b')).toBe(true);
  });

  it('keeps the clusters it opened with after the selection changes', () => {
    const { rerender } = openDialog();
    state.clusters = ['cluster-b'];
    rerender(<React.StrictMode>{React.cloneElement(state.launched[0].content)}</React.StrictMode>);
    expect(state.dialog?.cluster).toBe('cluster-a');
    expect(screen.queryByText('form cluster: cluster-a')).not.toBeNull();
  });

  it('closes its own activity', () => {
    openDialog();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(state.closed).toEqual(['knative-create-brokers']);
  });
});
