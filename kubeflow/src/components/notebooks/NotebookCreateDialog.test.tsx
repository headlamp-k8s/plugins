import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Only the cluster API, translations and the snackbar are mocked. The form, validation and
// object building run for real.
const { calls, notebookPost, clusterGet, pvcPost, pvcDelete, enqueueSnackbar, cluster } =
  vi.hoisted(() => {
    const calls: string[] = [];
    // Same arguments as apiEndpoint.post: the object, query parameters and the cluster.
    type Post = (body: any, query: any, cluster?: string) => Promise<any>;
    const post: Post = async (body, query) => {
      calls.push(`${query?.dryRun ? 'dry-run ' : ''}${body.kind}`);
      return body;
    };
    return {
      calls,
      notebookPost: vi.fn<Post>(post),
      // ApiProxy.clusterRequest, used to check whether an object exists. By default it doesn't.
      clusterGet: vi.fn<(path: string, params?: { cluster?: string }) => Promise<any>>(
        async (path, params) => {
          calls.push(`get ${path} in ${params?.cluster}`);
          throw Object.assign(new Error('Not Found'), { status: 404 });
        }
      ),
      pvcPost: vi.fn<Post>(post),
      pvcDelete: vi.fn(async (namespace: string, name: string) => {
        calls.push(`delete PersistentVolumeClaim ${namespace}/${name}`);
      }),
      enqueueSnackbar: vi.fn(),
      // What the mocked cluster looks like. Tests change it before rendering.
      cluster: {
        selected: ['test-cluster'],
        namespaces: ['kubeflow-user', 'team-b'] as string[] | null,
        namespaceError: null as Error | null,
      },
    };
  });

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) =>
      key.replace(/{{(\w+)}}/g, (_, name) => String(opts?.[name] ?? '')),
  }),
  ApiProxy: { clusterRequest: clusterGet },
  K8s: {
    useCluster: () => cluster.selected[0],
    useSelectedClusters: () => cluster.selected,
    ResourceClasses: {
      Namespace: {
        useList: () => [
          cluster.namespaces && cluster.namespaces.map(name => ({ metadata: { name } })),
          cluster.namespaceError,
        ],
      },
      PersistentVolumeClaim: {
        useList: () => [
          [{ metadata: { name: 'shared-data' } }, { metadata: { name: 'datasets' } }],
        ],
        apiEndpoint: { post: pvcPost, delete: pvcDelete },
      },
    },
  },
}));

vi.mock('../../resources/notebook', () => ({
  NotebookClass: { apiEndpoint: { post: notebookPost } },
}));

vi.mock('../../resources/podDefault', () => ({
  PodDefaultClass: {
    useList: () => [
      [
        {
          metadata: { name: 'access-ml-pipeline' },
          matchLabels: { 'access-ml-pipeline': 'true' },
          spec: { desc: 'Allow access to Kubeflow Pipelines' },
        },
        {
          metadata: { name: 'ml-tools' },
          matchLabels: { inject: 'ml-tools', tier: 'ml' },
          spec: { desc: 'Add ML tools' },
        },
        // Needs another value for `inject` than ml-tools, so the two can't be used together.
        {
          metadata: { name: 'web-tools' },
          matchLabels: { inject: 'web-tools' },
          spec: { desc: 'Add web tools' },
        },
        // Only applies to the Notebook named "trainer": the controller sets `statefulset` to it.
        {
          metadata: { name: 'trainer-gpu' },
          matchLabels: { statefulset: 'trainer' },
          spec: { desc: 'Share the trainer GPU' },
        },
      ],
    ],
  },
}));

vi.mock('notistack', () => ({ useSnackbar: () => ({ enqueueSnackbar }) }));

import { getDefaultNotebookFormValues, NotebookFormValues } from './notebookCreate';
import {
  getPodDefaultOptions,
  NotebookCreateDialog,
  NotebookCreateForm,
  NotebookCreateFormProps,
} from './NotebookCreateDialog';

type User = ReturnType<typeof userEvent.setup>;

async function selectNamespace(user: User, namespace: string) {
  await user.click(screen.getByRole('combobox', { name: /Namespace/ }));
  await user.click(await screen.findByRole('option', { name: namespace }));
}

async function fillRequiredFields(user: User, name = 'my-notebook') {
  await user.type(screen.getByRole('textbox', { name: /Name/ }), name);
  await selectNamespace(user, 'kubeflow-user');
}

function inputValue(label: RegExp | string) {
  return (screen.getByRole('combobox', { name: label }) as HTMLInputElement).value;
}

/** An error like the ones the Headlamp API functions throw, with the HTTP status. */
function apiError(message: string, status: number) {
  return Object.assign(new Error(message), { status });
}

async function selectExistingVolume(user: User, claimName: string) {
  await user.click(screen.getByRole('radio', { name: 'Existing volume' }));
  await user.click(screen.getByRole('combobox', { name: /PVC name/ }));
  await user.click(await screen.findByRole('option', { name: claimName }));
}

/** Posts made for real (not dry runs): [kind, body, cluster]. */
function createdObjects() {
  return [...notebookPost.mock.calls, ...pvcPost.mock.calls]
    .filter(([, query]) => !query?.dryRun)
    .map(([body, , clusterName]) => [body.kind, body, clusterName]);
}

beforeEach(() => {
  calls.length = 0;
  vi.clearAllMocks();
  cluster.selected = ['test-cluster'];
  cluster.namespaces = ['kubeflow-user', 'team-b'];
  cluster.namespaceError = null;
});

// ── NotebookCreateDialog ───────────────────────────────────────────────────────

describe('NotebookCreateDialog', () => {
  it('shows errors and does not call the API when the form is invalid', async () => {
    const user = userEvent.setup();
    render(<NotebookCreateDialog open onClose={() => {}} />);

    // No errors before the first submit.
    expect(screen.queryByText('Required')).toBeNull();

    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(screen.getAllByText('Required')).toHaveLength(2); // name and namespace
    expect(notebookPost).not.toHaveBeenCalled();
    expect(pvcPost).not.toHaveBeenCalled();
  });

  it('updates the errors as the user fixes the form', async () => {
    const user = userEvent.setup();
    render(<NotebookCreateDialog open onClose={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Create' }));
    expect(screen.getAllByText('Required')).toHaveLength(2);

    await user.type(screen.getByRole('textbox', { name: /Name/ }), 'Bad_Name');
    expect(screen.getAllByText('Required')).toHaveLength(1);
    expect(screen.getByText(/Use lowercase letters, numbers and "-"/)).toBeTruthy();
  });

  it('dry-runs both objects, then creates the PVC and the Notebook', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NotebookCreateDialog open onClose={onClose} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('checkbox', { name: 'Allow access to Kubeflow Pipelines' }));
    await user.click(screen.getByRole('checkbox', { name: 'Add ML tools' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(calls).toEqual([
      'dry-run Notebook',
      'dry-run PersistentVolumeClaim',
      'PersistentVolumeClaim',
      'Notebook',
    ]);

    const [notebook, , clusterName] = notebookPost.mock.calls[1];
    expect(clusterName).toBe('test-cluster');
    expect(notebook.metadata).toMatchObject({
      name: 'my-notebook',
      namespace: 'kubeflow-user',
      // Every label of each selected PodDefault's selector, so that it applies.
      labels: { app: 'my-notebook', 'access-ml-pipeline': 'true', inject: 'ml-tools', tier: 'ml' },
    });
    expect(pvcPost.mock.calls[1][0].metadata).toEqual({
      name: 'my-notebook-workspace',
      namespace: 'kubeflow-user',
    });
    expect(enqueueSnackbar).toHaveBeenCalledWith('Created notebook server my-notebook', {
      variant: 'success',
    });
  });

  it('does not create a Notebook whose name starts with a digit', async () => {
    const user = userEvent.setup();
    render(<NotebookCreateDialog open onClose={() => {}} />);

    await fillRequiredFields(user, '1-notebook');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      screen.getByText(
        'Use lowercase letters, numbers and "-", start with a letter, and end with a letter or number'
      )
    ).toBeTruthy();
    expect(notebookPost).not.toHaveBeenCalled();
  });

  it('does not create a Notebook with PodDefaults that cannot both apply', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NotebookCreateDialog open onClose={onClose} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('checkbox', { name: 'Add ML tools' }));
    await user.click(screen.getByRole('checkbox', { name: 'Add web tools' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const conflict =
      '"Add ML tools" and "Add web tools" need different values for the label inject. Select only one of them.';
    expect(screen.getByText(conflict)).toBeTruthy();
    expect(notebookPost).not.toHaveBeenCalled();

    await user.click(screen.getByRole('checkbox', { name: 'Add web tools' }));
    expect(screen.queryByText(conflict)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(notebookPost.mock.calls[1][0].metadata.labels).toEqual({
      app: 'my-notebook',
      inject: 'ml-tools',
      tier: 'ml',
    });
  });

  it('does not create a Notebook whose PodDefault needs another name label value', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NotebookCreateDialog open onClose={onClose} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('checkbox', { name: 'Share the trainer GPU' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      screen.getByText(
        '"Share the trainer GPU" needs the label statefulset to be "trainer", which the notebook server sets to its own name. Name the server "trainer" or don\'t select it.'
      )
    ).toBeTruthy();
    expect(notebookPost).not.toHaveBeenCalled();

    // With the name the PodDefault needs, the Notebook can be created.
    const nameField = screen.getByRole('textbox', { name: /Name/ });
    await user.clear(nameField);
    await user.type(nameField, 'trainer');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(notebookPost.mock.calls[1][0].metadata.labels).toEqual({
      app: 'trainer',
      statefulset: 'trainer',
    });
  });

  it('creates nothing and shows the error when the Notebook is rejected', async () => {
    notebookPost.mockRejectedValueOnce(new Error('notebooks.kubeflow.org "my-notebook" exists'));
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NotebookCreateDialog open onClose={onClose} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText(
        'Could not create the notebook server: notebooks.kubeflow.org "my-notebook" exists'
      )
    ).toBeTruthy();
    // The Notebook dry run failed first, so no PVC was created.
    expect(pvcPost).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('deletes the new PVC when the Notebook is rejected after the PVC was created', async () => {
    // The dry run passes, but the real create fails (e.g. a quota or webhook decides late).
    notebookPost
      .mockImplementationOnce(async body => body)
      .mockRejectedValueOnce(apiError('exceeded quota', 403));
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NotebookCreateDialog open onClose={onClose} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('Could not create the notebook server: exceeded quota')
    ).toBeTruthy();
    // A 4xx means the Notebook was not created, so there is no need to check.
    expect(clusterGet).not.toHaveBeenCalled();
    expect(pvcDelete).toHaveBeenCalledWith(
      'kubeflow-user',
      'my-notebook-workspace',
      {},
      'test-cluster'
    );
    expect(onClose).not.toHaveBeenCalled();
    // The form is usable again for a retry.
    expect(screen.getByRole('button', { name: 'Create' })).toHaveProperty('disabled', false);
  });

  it('deletes the new PVC after an unclear failure if the Notebook does not exist', async () => {
    notebookPost
      .mockImplementationOnce(async body => body)
      .mockRejectedValueOnce(apiError('Request timed-out', 408));
    const user = userEvent.setup();
    render(<NotebookCreateDialog open onClose={() => {}} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('Could not create the notebook server: Request timed-out')
    ).toBeTruthy();
    expect(calls.slice(-2)).toEqual([
      'get /apis/kubeflow.org/v1/namespaces/kubeflow-user/notebooks/my-notebook in test-cluster',
      'delete PersistentVolumeClaim kubeflow-user/my-notebook-workspace',
    ]);
    expect(screen.queryByText(/may still have been created/)).toBeNull();
  });

  it.each([
    ['exists', async () => ({ kind: 'Notebook' })],
    [
      'cannot be checked',
      async () => {
        throw apiError('Unreachable', 502);
      },
    ],
  ])('keeps the new PVC after an unclear failure if the Notebook %s', async (_, getNotebook) => {
    // The connection was lost, so the Notebook may have been created.
    notebookPost
      .mockImplementationOnce(async body => body)
      .mockRejectedValueOnce(apiError('Unreachable', 502));
    clusterGet.mockImplementationOnce(getNotebook);
    const user = userEvent.setup();
    render(<NotebookCreateDialog open onClose={() => {}} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText(/The notebook server may still have been created, so its PVC/)
    ).toBeTruthy();
    expect(screen.getByText(/my-notebook-workspace was kept/)).toBeTruthy();
    expect(clusterGet).toHaveBeenCalled();
    expect(pvcDelete).not.toHaveBeenCalled();
  });

  it('keeps the new PVC if another client created the Notebook first', async () => {
    // Someone created a Notebook with this name between the dry run and the real create. It
    // may use the PVC created here, so the PVC must not be deleted.
    notebookPost
      .mockImplementationOnce(async body => body)
      .mockRejectedValueOnce(apiError('notebooks.kubeflow.org "my-notebook" already exists', 409));
    clusterGet.mockImplementationOnce(async () => ({ kind: 'Notebook' }));
    const user = userEvent.setup();
    render(<NotebookCreateDialog open onClose={() => {}} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(await screen.findByText(/my-notebook-workspace was kept/)).toBeTruthy();
    expect(clusterGet).toHaveBeenCalledWith(
      '/apis/kubeflow.org/v1/namespaces/kubeflow-user/notebooks/my-notebook',
      { cluster: 'test-cluster' }
    );
    expect(pvcDelete).not.toHaveBeenCalled();
  });

  it('shows the original error and the PVC to remove if deleting the PVC fails', async () => {
    notebookPost
      .mockImplementationOnce(async body => body)
      .mockRejectedValueOnce(apiError('exceeded quota', 403));
    pvcDelete.mockRejectedValueOnce(apiError('persistentvolumeclaims is forbidden', 403));
    const user = userEvent.setup();
    render(<NotebookCreateDialog open onClose={() => {}} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('Could not create the notebook server: exceeded quota')
    ).toBeTruthy();
    expect(
      screen.getByText(
        'The new PVC my-notebook-workspace could not be deleted: persistentvolumeclaims is forbidden. Delete it or use it as an existing volume before trying again.'
      )
    ).toBeTruthy();
  });

  it('neither checks nor deletes the PVC when the API server rejects it', async () => {
    // The dry run passes, but the real create fails.
    pvcPost
      .mockImplementationOnce(async body => body)
      .mockRejectedValueOnce(apiError('exceeded quota', 403));
    const user = userEvent.setup();
    render(<NotebookCreateDialog open onClose={() => {}} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('Could not create the notebook server: exceeded quota')
    ).toBeTruthy();
    expect(clusterGet).not.toHaveBeenCalled();
    expect(pvcDelete).not.toHaveBeenCalled();
    expect(notebookPost).toHaveBeenCalledTimes(1); // only the dry run
  });

  it('does not warn about the PVC after an unclear failure if the PVC does not exist', async () => {
    pvcPost
      .mockImplementationOnce(async body => body)
      .mockRejectedValueOnce(apiError('Request timed-out', 408));
    const user = userEvent.setup();
    render(<NotebookCreateDialog open onClose={() => {}} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('Could not create the notebook server: Request timed-out')
    ).toBeTruthy();
    expect(calls.slice(-1)).toEqual([
      'get /api/v1/namespaces/kubeflow-user/persistentvolumeclaims/my-notebook-workspace in test-cluster',
    ]);
    expect(screen.queryByText(/may have been created/)).toBeNull();
    expect(notebookPost).toHaveBeenCalledTimes(1); // only the dry run
  });

  it.each([
    ['exists', async () => ({ kind: 'PersistentVolumeClaim' })],
    [
      'cannot be checked',
      async () => {
        throw apiError('Unreachable', 502);
      },
    ],
  ])('keeps the PVC after an unclear failure if the PVC %s', async (_, getPvc) => {
    // The PVC may have been stored before the response was lost.
    pvcPost
      .mockImplementationOnce(async body => body)
      .mockRejectedValueOnce(apiError('Request timed-out', 408));
    clusterGet.mockImplementationOnce(getPvc);
    const user = userEvent.setup();
    render(<NotebookCreateDialog open onClose={() => {}} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText(
        'The PVC my-notebook-workspace may have been created. If it exists, delete it or use it as an existing volume before trying again.'
      )
    ).toBeTruthy();
    // It may have been created by someone else, so it is not deleted.
    expect(pvcDelete).not.toHaveBeenCalled();
    // The Notebook is not created without its PVC.
    expect(notebookPost).toHaveBeenCalledTimes(1); // only the dry run
  });

  it('does not mount the workspace at /dev/shm while shared memory is enabled', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NotebookCreateDialog open onClose={onClose} />);

    await fillRequiredFields(user);
    const mountPath = screen.getByRole('textbox', { name: /Mount path/ });
    await user.clear(mountPath);
    await user.type(mountPath, '/dev/shm');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(
      screen.getByText(
        'Shared memory is mounted at /dev/shm. Use another path or turn off shared memory'
      )
    ).toBeTruthy();
    expect(notebookPost).not.toHaveBeenCalled();

    await user.click(screen.getByRole('checkbox', { name: /shared memory/ }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(notebookPost.mock.calls[1][0].spec.template.spec.containers[0].volumeMounts).toEqual([
      { name: 'workspace', mountPath: '/dev/shm' },
    ]);
  });

  it('does not create a PVC for an existing workspace volume', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NotebookCreateDialog open onClose={onClose} />);

    await fillRequiredFields(user);
    await selectExistingVolume(user, 'datasets');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(pvcPost).not.toHaveBeenCalled();
    expect(calls).toEqual(['dry-run Notebook', 'Notebook']);
    expect(notebookPost.mock.calls[1][0].spec.template.spec.volumes[0]).toEqual({
      name: 'workspace',
      persistentVolumeClaim: { claimName: 'datasets' },
    });
  });

  it('does not create a PVC when there is no workspace volume', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NotebookCreateDialog open onClose={onClose} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('radio', { name: 'None' }));
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(calls).toEqual(['dry-run Notebook', 'Notebook']);
  });

  it('accepts a typed namespace, for users who cannot list namespaces', async () => {
    cluster.namespaces = null;
    cluster.namespaceError = new Error('namespaces is forbidden');
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NotebookCreateDialog open onClose={onClose} />);

    await user.type(screen.getByRole('textbox', { name: /Name/ }), 'my-notebook');
    await user.type(screen.getByRole('combobox', { name: /Namespace/ }), 'my-profile');
    await user.tab(); // leaving the field commits the typed value
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(notebookPost.mock.calls[1][0].metadata.namespace).toBe('my-profile');
  });

  it('clears the selected PodDefaults when the namespace changes', async () => {
    const user = userEvent.setup();
    render(<NotebookCreateDialog open onClose={() => {}} />);

    await selectNamespace(user, 'kubeflow-user');
    const checkbox = screen.getByRole('checkbox', { name: 'Allow access to Kubeflow Pipelines' });
    await user.click(checkbox);
    expect(checkbox).toHaveProperty('checked', true);

    await selectNamespace(user, 'team-b');
    expect(
      screen.getByRole('checkbox', { name: 'Allow access to Kubeflow Pipelines' })
    ).toHaveProperty('checked', false);
  });

  it('clears the selected PVC when the namespace changes', async () => {
    const user = userEvent.setup();
    render(<NotebookCreateDialog open onClose={() => {}} />);

    await selectNamespace(user, 'kubeflow-user');
    await selectExistingVolume(user, 'datasets');
    expect(inputValue(/PVC name/)).toBe('datasets');

    await selectNamespace(user, 'team-b');
    expect(inputValue(/PVC name/)).toBe('');
  });

  it('clears the selected PVC when the cluster changes', async () => {
    cluster.selected = ['cluster-a', 'cluster-b'];
    const user = userEvent.setup();
    render(<NotebookCreateDialog open onClose={() => {}} />);

    await selectNamespace(user, 'kubeflow-user');
    await selectExistingVolume(user, 'datasets');
    await user.click(screen.getByRole('combobox', { name: 'Cluster' }));
    await user.click(await screen.findByRole('option', { name: 'cluster-b' }));

    await selectNamespace(user, 'kubeflow-user');
    expect(inputValue(/PVC name/)).toBe('');
  });

  it('has no cluster picker when one cluster is selected', () => {
    render(<NotebookCreateDialog open onClose={() => {}} />);
    expect(screen.queryByRole('combobox', { name: 'Cluster' })).toBeNull();
  });

  it('creates the notebook in the cluster the user picks', async () => {
    cluster.selected = ['cluster-a', 'cluster-b'];
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NotebookCreateDialog open onClose={onClose} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('combobox', { name: 'Cluster' }));
    await user.click(await screen.findByRole('option', { name: 'cluster-b' }));

    // The namespace belonged to the other cluster, so it is cleared.
    expect(inputValue(/Namespace/)).toBe('');

    await selectNamespace(user, 'kubeflow-user');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(createdObjects().map(([kind, , clusterName]) => [kind, clusterName])).toEqual([
      ['Notebook', 'cluster-b'],
      ['PersistentVolumeClaim', 'cluster-b'],
    ]);
  });

  it('disables the form and cannot be closed while creating', async () => {
    let finishDryRun: () => void = () => {};
    notebookPost.mockImplementationOnce(
      body => new Promise(resolve => (finishDryRun = () => resolve(body)))
    );
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NotebookCreateDialog open onClose={onClose} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Create' }));

    expect(screen.getByRole('button', { name: 'Create' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveProperty('disabled', true);
    expect(screen.getByRole('textbox', { name: /Name/ })).toHaveProperty('disabled', true);
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();

    finishDryRun();
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('closes without calling the API on Cancel', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<NotebookCreateDialog open onClose={onClose} />);

    await fillRequiredFields(user);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
    expect(notebookPost).not.toHaveBeenCalled();
  });
});

// ── NotebookCreateForm ─────────────────────────────────────────────────────────

function StatefulForm(props: Partial<NotebookCreateFormProps>) {
  const [values, setValues] = React.useState<NotebookFormValues>(
    props.values || getDefaultNotebookFormValues('kubeflow-user')
  );
  return (
    <NotebookCreateForm
      errors={{}}
      namespaces={['kubeflow-user']}
      claimNames={[]}
      podDefaults={[]}
      {...props}
      values={values}
      onChange={setValues}
    />
  );
}

describe('NotebookCreateForm', () => {
  it('switches to the default image of the chosen server type', async () => {
    const user = userEvent.setup();
    render(<StatefulForm />);

    expect(inputValue(/Image/)).toContain('jupyter-scipy');
    await user.click(screen.getByRole('button', { name: 'VS Code' }));
    expect(inputValue(/Image/)).toContain('codeserver-python');
    await user.click(screen.getByRole('button', { name: 'RStudio' }));
    expect(inputValue(/Image/)).toContain('rstudio-tidyverse');
  });

  it('keeps a custom image when the server type changes', async () => {
    const user = userEvent.setup();
    render(
      <StatefulForm
        values={{ ...getDefaultNotebookFormValues('kubeflow-user'), image: 'my/image:1' }}
      />
    );

    await user.click(screen.getByRole('button', { name: 'VS Code' }));
    expect(inputValue(/Image/)).toBe('my/image:1');
  });

  it('asks for the number of GPUs only once a vendor is chosen', async () => {
    const user = userEvent.setup();
    render(<StatefulForm />);

    expect(screen.queryByRole('textbox', { name: /Number of GPUs/ })).toBeNull();
    await user.click(screen.getByRole('combobox', { name: 'Vendor' }));
    await user.click(await screen.findByRole('option', { name: 'NVIDIA' }));
    expect(screen.getByRole('textbox', { name: /Number of GPUs/ })).toHaveProperty('value', '1');
  });

  it('shows the fields of each workspace volume type', async () => {
    const user = userEvent.setup();
    render(<StatefulForm claimNames={['datasets']} />);

    expect(screen.getByRole('textbox', { name: /Size \(Gi\)/ })).toBeTruthy();

    await user.click(screen.getByRole('radio', { name: 'Existing volume' }));
    expect(screen.queryByRole('textbox', { name: /Size \(Gi\)/ })).toBeNull();
    expect(screen.getByRole('combobox', { name: /PVC name/ })).toBeTruthy();

    await user.click(screen.getByRole('radio', { name: 'None' }));
    expect(screen.queryByRole('textbox', { name: /Mount path/ })).toBeNull();
    expect(screen.getByText(/files are lost when the notebook restarts/)).toBeTruthy();
  });

  it('names the PVC that a new workspace volume creates', () => {
    render(
      <StatefulForm values={{ ...getDefaultNotebookFormValues('kubeflow-user'), name: 'nb-1' }} />
    );
    expect(screen.getByText('Creates the PVC nb-1-workspace')).toBeTruthy();
  });

  it('shows the default limits as placeholders', () => {
    render(<StatefulForm />);
    expect(screen.getByRole('textbox', { name: 'CPU limit' })).toHaveProperty('placeholder', '0.6');
    expect(screen.getByRole('textbox', { name: 'Memory limit (Gi)' })).toHaveProperty(
      'placeholder',
      '1.2'
    );
  });

  it('explains why there are no PodDefaults to choose', () => {
    const { rerender } = render(
      <StatefulForm values={{ ...getDefaultNotebookFormValues(''), name: 'nb' }} />
    );
    expect(screen.getByText('Select a namespace to see its PodDefaults.')).toBeTruthy();

    rerender(<StatefulForm key="with-namespace" />);
    expect(screen.getByText('No PodDefaults in this namespace.')).toBeTruthy();
  });

  it('shows the error message for each error code', () => {
    render(
      <StatefulForm
        errors={{
          name: 'nameTooLong',
          namespace: 'nameTooLong',
          cpu: 'notPositiveNumber',
          cpuLimit: 'limitBelowRequest',
          workspaceSize: 'notPositiveInteger',
          workspaceMountPath: 'notAbsolutePath',
        }}
      />
    );
    // The two names have different limits.
    expect(screen.getByText('Use at most 52 characters')).toBeTruthy();
    expect(screen.getByText('Use at most 63 characters')).toBeTruthy();
    expect(screen.getByText('Enter a number greater than 0')).toBeTruthy();
    expect(screen.getByText('The limit cannot be lower than the request')).toBeTruthy();
    expect(screen.getByText('Enter a whole number greater than 0')).toBeTruthy();
    expect(screen.getByText('Enter an absolute path, such as /home/jovyan')).toBeTruthy();
  });

  it('explains the different name rules of Notebooks and namespaces', () => {
    render(<StatefulForm errors={{ name: 'invalidName', namespace: 'invalidNamespace' }} />);
    expect(
      screen.getByText(
        'Use lowercase letters, numbers and "-", start with a letter, and end with a letter or number'
      )
    ).toBeTruthy();
    expect(
      screen.getByText(
        'Use lowercase letters, numbers and "-", and start and end with a letter or number'
      )
    ).toBeTruthy();
  });

  it('explains the PVC name rules and limit', () => {
    const existing = getDefaultNotebookFormValues('kubeflow-user');
    existing.workspace = { ...existing.workspace, type: 'existing', claimName: 'Shared_Data' };
    const { unmount } = render(
      <StatefulForm values={existing} errors={{ workspaceClaimName: 'invalidPvcName' }} />
    );
    expect(
      screen.getByText(
        'Use lowercase letters, numbers, "-" and ".", and start and end with a letter or number'
      )
    ).toBeTruthy();
    unmount();
    render(<StatefulForm values={existing} errors={{ workspaceClaimName: 'nameTooLong' }} />);
    expect(screen.getByText('Use at most 253 characters')).toBeTruthy();
  });

  it('disables every field while saving', () => {
    render(
      <StatefulForm
        disabled
        podDefaults={[{ name: 'a', matchLabels: { 'add-a': 'true' }, description: 'Add A' }]}
      />
    );
    const dialog = within(document.body);
    for (const field of [
      dialog.getByRole('textbox', { name: /Name/ }),
      dialog.getByRole('combobox', { name: /Image/ }),
      dialog.getByRole('textbox', { name: /CPU request/ }),
      dialog.getByRole('radio', { name: 'New volume' }),
      dialog.getByRole('checkbox', { name: 'Add A' }),
      dialog.getByRole('checkbox', { name: /shared memory/ }),
    ]) {
      expect(field).toHaveProperty('disabled', true);
    }
  });
});

// ── getPodDefaultOptions ───────────────────────────────────────────────────────

describe('getPodDefaultOptions', () => {
  it('keeps all selector labels and skips PodDefaults without any', () => {
    expect(
      getPodDefaultOptions([
        { metadata: { name: 'a' }, matchLabels: { 'add-a': 'true' }, spec: { desc: 'Add A' } },
        { metadata: { name: 'b' }, matchLabels: undefined, spec: {} },
        { metadata: { name: 'c' }, matchLabels: { inject: 'c', tier: 'ml' }, spec: {} },
        { metadata: { name: 'd' }, matchLabels: {}, spec: {} },
      ] as any)
    ).toEqual([
      { name: 'a', matchLabels: { 'add-a': 'true' }, description: 'Add A' },
      { name: 'c', matchLabels: { inject: 'c', tier: 'ml' }, description: 'c' },
    ]);
  });

  it('skips PodDefaults whose selector has expressions the form cannot satisfy', () => {
    expect(
      getPodDefaultOptions([
        {
          metadata: { name: 'with-expressions' },
          matchLabels: { inject: 'true' },
          spec: {
            selector: {
              matchLabels: { inject: 'true' },
              matchExpressions: [{ key: 'tier', operator: 'In', values: ['ml'] }],
            },
          },
        },
        {
          metadata: { name: 'empty-expressions' },
          matchLabels: { 'add-e': 'true' },
          spec: { selector: { matchLabels: { 'add-e': 'true' }, matchExpressions: [] } },
        },
      ] as any)
    ).toEqual([
      {
        name: 'empty-expressions',
        matchLabels: { 'add-e': 'true' },
        description: 'empty-expressions',
      },
    ]);
  });
});
