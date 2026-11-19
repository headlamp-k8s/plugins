import {
  buildNotebookObjects,
  defaultLimit,
  findPodDefaultConflict,
  findPodDefaultNameLabelConflict,
  getDefaultNotebookFormValues,
  HEADERS_ANNOTATION,
  NotebookFormValues,
  SERVER_TYPE_ANNOTATION,
  URI_REWRITE_ANNOTATION,
  validateClaimName,
  validateName,
  validateNotebookForm,
} from './notebookCreate';

function formValues(overrides: Partial<NotebookFormValues> = {}): NotebookFormValues {
  return { ...getDefaultNotebookFormValues('kubeflow-user'), name: 'my-notebook', ...overrides };
}

// ── validateName ───────────────────────────────────────────────────────────────

describe('validateName', () => {
  it('accepts a DNS-1123 label', () => {
    expect(validateName('my-notebook-1')).toBeUndefined();
  });

  it('requires a name', () => {
    expect(validateName('')).toBe('required');
  });

  it.each(['My-Notebook', 'my_notebook', '-notebook', 'notebook-', 'my.notebook', '1-notebook'])(
    'rejects %s',
    name => {
      expect(validateName(name)).toBe('invalidName');
    }
  );

  it('rejects names longer than 52 characters', () => {
    expect(validateName('a'.repeat(52))).toBeUndefined();
    expect(validateName('a'.repeat(53))).toBe('nameTooLong');
  });
});

// ── validateClaimName ──────────────────────────────────────────────────────────

describe('validateClaimName', () => {
  // PVC names are DNS-1123 subdomains, so dots, a leading digit and 253 characters are fine.
  it.each(['datasets', 'shared.data', '1-data', ' datasets ', 'a'.repeat(253)])(
    'accepts %s',
    claimName => {
      expect(validateClaimName(claimName)).toBeUndefined();
    }
  );

  it.each(['', '   '])('requires a name, not %j', claimName => {
    expect(validateClaimName(claimName)).toBe('required');
  });

  it.each(['Shared_Data', 'Datasets', 'data-', '.data', 'shared..data', 'shared.-data'])(
    'rejects %s',
    claimName => {
      expect(validateClaimName(claimName)).toBe('invalidPvcName');
    }
  );

  it('rejects names longer than 253 characters', () => {
    expect(validateClaimName('a'.repeat(254))).toBe('nameTooLong');
  });
});

// ── validateNotebookForm ───────────────────────────────────────────────────────

describe('validateNotebookForm', () => {
  it('accepts the defaults once a name is set', () => {
    expect(validateNotebookForm(formValues())).toEqual({});
  });

  it('checks the format of a typed namespace', () => {
    expect(validateNotebookForm(formValues({ namespace: 'Team_A' })).namespace).toBe(
      'invalidNamespace'
    );
    // Unlike a Notebook name, a namespace may start with a digit.
    expect(validateNotebookForm(formValues({ namespace: '1-team' }))).toEqual({});
    // Namespaces may be up to 63 characters, longer than notebook names.
    expect(validateNotebookForm(formValues({ namespace: 'a'.repeat(63) }))).toEqual({});
    expect(validateNotebookForm(formValues({ namespace: 'a'.repeat(64) })).namespace).toBe(
      'nameTooLong'
    );
  });

  it('builds limits that pass validation for a tiny request', () => {
    const values = formValues({ cpu: '0.01', memoryGi: '0.01' });
    expect(validateNotebookForm(values)).toEqual({});
    const { notebook } = buildNotebookObjects(values);
    expect(notebook.spec.template.spec.containers[0].resources?.limits).toEqual({
      cpu: '0.01',
      memory: '0.01Gi',
    });
  });

  it('requires a namespace and an image', () => {
    expect(validateNotebookForm(formValues({ namespace: '', image: ' ' }))).toEqual({
      namespace: 'required',
      image: 'required',
    });
  });

  it.each(['0', '-1', 'abc', '1Gi', 'NaN'])('rejects %s as a CPU request', cpu => {
    expect(validateNotebookForm(formValues({ cpu })).cpu).toBe('notPositiveNumber');
  });

  it('accepts decimal requests such as .5 and 0.5', () => {
    expect(validateNotebookForm(formValues({ cpu: '.5', memoryGi: '0.5' }))).toEqual({});
  });

  it('rejects a limit below its request', () => {
    const errors = validateNotebookForm(
      formValues({ cpu: '2', cpuLimit: '1', memoryGi: '4', memoryLimitGi: '2' })
    );
    expect(errors.cpuLimit).toBe('limitBelowRequest');
    expect(errors.memoryLimitGi).toBe('limitBelowRequest');
  });

  it('accepts a limit equal to its request', () => {
    expect(validateNotebookForm(formValues({ cpu: '1', cpuLimit: '1' }))).toEqual({});
  });

  it('checks the GPU count only when a vendor is chosen', () => {
    expect(validateNotebookForm(formValues({ gpuVendor: '', gpuCount: 'x' }))).toEqual({});
    expect(
      validateNotebookForm(formValues({ gpuVendor: 'nvidia.com/gpu', gpuCount: '0' })).gpuCount
    ).toBe('notPositiveInteger');
  });

  it('checks the workspace fields that apply to its type', () => {
    const defaults = getDefaultNotebookFormValues().workspace;
    expect(
      validateNotebookForm(formValues({ workspace: { ...defaults, sizeGi: '1.5' } })).workspaceSize
    ).toBe('notPositiveInteger');
    expect(
      validateNotebookForm(formValues({ workspace: { ...defaults, type: 'existing' } }))
        .workspaceClaimName
    ).toBe('required');
    // buildNotebookObjects trims the name, so only spaces would give an empty claimName.
    expect(
      validateNotebookForm(
        formValues({ workspace: { ...defaults, type: 'existing', claimName: '   ' } })
      ).workspaceClaimName
    ).toBe('required');
    expect(
      validateNotebookForm(
        formValues({ workspace: { ...defaults, type: 'existing', claimName: 'Shared_Data' } })
      ).workspaceClaimName
    ).toBe('invalidPvcName');
    expect(
      validateNotebookForm(formValues({ workspace: { ...defaults, mountPath: 'home' } }))
        .workspaceMountPath
    ).toBe('notAbsolutePath');
    expect(
      validateNotebookForm(
        formValues({ workspace: { ...defaults, type: 'none', mountPath: '', sizeGi: '' } })
      )
    ).toEqual({});
  });

  it.each(['/dev/shm', '/dev/shm/', '//dev//shm'])(
    'rejects %s as the mount path while shared memory is enabled',
    mountPath => {
      const workspace = { ...getDefaultNotebookFormValues().workspace, mountPath };
      expect(validateNotebookForm(formValues({ workspace })).workspaceMountPath).toBe(
        'sharedMemoryPath'
      );
      expect(validateNotebookForm(formValues({ workspace, enableSharedMemory: false }))).toEqual(
        {}
      );
    }
  );

  it('accepts a mount path below /dev/shm', () => {
    const workspace = { ...getDefaultNotebookFormValues().workspace, mountPath: '/dev/shm/data' };
    expect(validateNotebookForm(formValues({ workspace }))).toEqual({});
  });

  it('rejects PodDefaults that need different values for the same label', () => {
    const mlTools = { name: 'ml-tools', matchLabels: { inject: 'ml-tools', tier: 'ml' } };
    const webTools = { name: 'web-tools', matchLabels: { inject: 'web-tools' } };
    expect(validateNotebookForm(formValues({ podDefaults: [mlTools, webTools] }))).toEqual({
      podDefaults: 'podDefaultConflict',
    });
    // Needing the same value for a label is fine.
    const mlGpu = { name: 'ml-gpu', matchLabels: { tier: 'ml', gpu: 'true' } };
    expect(validateNotebookForm(formValues({ podDefaults: [mlTools, mlGpu] }))).toEqual({});
  });

  it('rejects PodDefaults that need another value for a label set to the Notebook name', () => {
    // The controller copies the Notebook's labels onto the Pod, but the StatefulSet selector
    // stays `statefulset: <name>`, so Kubernetes would reject the StatefulSet.
    const trainer = { name: 'trainer', matchLabels: { statefulset: 'trainer' } };
    expect(validateNotebookForm(formValues({ podDefaults: [trainer] }))).toEqual({
      podDefaults: 'podDefaultNameLabel',
    });
    // It works for the Notebook with that name.
    expect(validateNotebookForm(formValues({ name: 'trainer', podDefaults: [trainer] }))).toEqual(
      {}
    );
  });
});

// ── findPodDefaultNameLabelConflict ────────────────────────────────────────────

describe('findPodDefaultNameLabelConflict', () => {
  it('names the PodDefault, the label and the value it needs', () => {
    expect(
      findPodDefaultNameLabelConflict(
        [
          { name: 'a', matchLabels: { 'add-a': 'true' } },
          { name: 'b', matchLabels: { 'notebook-name': 'other' } },
        ],
        'my-notebook'
      )
    ).toEqual({ podDefault: 'b', label: 'notebook-name', value: 'other' });
  });

  it('accepts name labels that match the Notebook name', () => {
    expect(
      findPodDefaultNameLabelConflict(
        [
          {
            name: 'a',
            matchLabels: { statefulset: 'my-notebook', 'notebook-name': 'my-notebook' },
          },
        ],
        'my-notebook'
      )
    ).toBeUndefined();
  });
});

// ── findPodDefaultConflict ─────────────────────────────────────────────────────

describe('findPodDefaultConflict', () => {
  it('names the two PodDefaults and the label they disagree on', () => {
    expect(
      findPodDefaultConflict([
        { name: 'a', matchLabels: { 'add-a': 'true' } },
        { name: 'b', matchLabels: { tier: 'ml' } },
        { name: 'c', matchLabels: { 'add-c': 'true', tier: 'web' } },
      ])
    ).toEqual({ first: 'b', second: 'c', label: 'tier' });
  });

  it('finds no conflict when the selectors agree', () => {
    expect(
      findPodDefaultConflict([
        { name: 'a', matchLabels: { tier: 'ml' } },
        { name: 'b', matchLabels: { tier: 'ml', 'add-b': 'true' } },
      ])
    ).toBeUndefined();
  });
});

// ── defaultLimit ───────────────────────────────────────────────────────────────

describe('defaultLimit', () => {
  it('multiplies the request by 1.2 and rounds to one decimal', () => {
    expect(defaultLimit('0.5')).toBe('0.6');
    expect(defaultLimit('1')).toBe('1.2');
    expect(defaultLimit('3')).toBe('3.6');
    expect(defaultLimit('0.1')).toBe('0.1');
  });

  it('never returns a limit below the request', () => {
    // 0.01 x 1.2 rounds to 0, which would make the notebook's pod invalid.
    expect(defaultLimit('0.01')).toBe('0.01');
    expect(defaultLimit('0.04')).toBe('0.04');
    expect(defaultLimit('0.05')).toBe('0.1');
  });
});

// ── buildNotebookObjects ───────────────────────────────────────────────────────

describe('buildNotebookObjects', () => {
  it('builds the Notebook like the Kubeflow web app for the defaults', () => {
    const { notebook, workspacePvc } = buildNotebookObjects(formValues());

    expect(notebook).toEqual({
      apiVersion: 'kubeflow.org/v1',
      kind: 'Notebook',
      metadata: {
        name: 'my-notebook',
        namespace: 'kubeflow-user',
        labels: { app: 'my-notebook' },
        annotations: { [SERVER_TYPE_ANNOTATION]: 'jupyter' },
      },
      spec: {
        template: {
          spec: {
            serviceAccountName: 'default-editor',
            containers: [
              {
                name: 'my-notebook',
                image: 'ghcr.io/kubeflow/kubeflow/notebook-servers/jupyter-scipy:latest',
                imagePullPolicy: 'IfNotPresent',
                resources: {
                  requests: { cpu: '0.5', memory: '1Gi' },
                  limits: { cpu: '0.6', memory: '1.2Gi' },
                },
                volumeMounts: [
                  { name: 'workspace', mountPath: '/home/jovyan' },
                  { name: 'dshm', mountPath: '/dev/shm' },
                ],
              },
            ],
            volumes: [
              {
                name: 'workspace',
                persistentVolumeClaim: { claimName: 'my-notebook-workspace' },
              },
              { name: 'dshm', emptyDir: { medium: 'Memory' } },
            ],
          },
        },
      },
    });

    expect(workspacePvc).toEqual({
      apiVersion: 'v1',
      kind: 'PersistentVolumeClaim',
      metadata: { name: 'my-notebook-workspace', namespace: 'kubeflow-user' },
      spec: { accessModes: ['ReadWriteOnce'], resources: { requests: { storage: '5Gi' } } },
    });
  });

  it('uses explicit limits instead of the default factor', () => {
    const { notebook } = buildNotebookObjects(
      formValues({ cpu: '1', cpuLimit: '2', memoryGi: '2', memoryLimitGi: '4' })
    );
    expect(notebook.spec.template.spec.containers[0].resources).toEqual({
      requests: { cpu: '1', memory: '2Gi' },
      limits: { cpu: '2', memory: '4Gi' },
    });
  });

  it('adds the GPU limit for the chosen vendor', () => {
    const { notebook } = buildNotebookObjects(
      formValues({ gpuVendor: 'nvidia.com/gpu', gpuCount: '2' })
    );
    expect(notebook.spec.template.spec.containers[0].resources?.limits).toEqual({
      cpu: '0.6',
      memory: '1.2Gi',
      'nvidia.com/gpu': '2',
    });
  });

  it('mounts an existing PVC without creating one', () => {
    // A valid PVC name, but not a valid volume name, so the volume gets a fixed name.
    const { notebook, workspacePvc } = buildNotebookObjects(
      formValues({
        workspace: { type: 'existing', claimName: 'shared.data', sizeGi: '', mountPath: '/data' },
        enableSharedMemory: false,
      })
    );
    expect(workspacePvc).toBeUndefined();
    expect(notebook.spec.template.spec.volumes).toEqual([
      { name: 'workspace', persistentVolumeClaim: { claimName: 'shared.data' } },
    ]);
    expect(notebook.spec.template.spec.containers[0].volumeMounts).toEqual([
      { name: 'workspace', mountPath: '/data' },
    ]);
  });

  it('does not clash with the shared memory volume for a PVC named dshm', () => {
    const { notebook } = buildNotebookObjects(
      formValues({
        workspace: { type: 'existing', claimName: 'dshm', sizeGi: '', mountPath: '/data' },
      })
    );
    expect(notebook.spec.template.spec.volumes).toEqual([
      { name: 'workspace', persistentVolumeClaim: { claimName: 'dshm' } },
      { name: 'dshm', emptyDir: { medium: 'Memory' } },
    ]);
  });

  it('adds no volumes when there is no workspace and no shared memory', () => {
    const { notebook, workspacePvc } = buildNotebookObjects(
      formValues({
        workspace: { ...getDefaultNotebookFormValues().workspace, type: 'none' },
        enableSharedMemory: false,
      })
    );
    expect(workspacePvc).toBeUndefined();
    expect(notebook.spec.template.spec.volumes).toEqual([]);
    expect(notebook.spec.template.spec.containers[0].volumeMounts).toEqual([]);
  });

  it('labels the Notebook with every selector label of the selected PodDefaults', () => {
    const { notebook } = buildNotebookObjects(
      formValues({
        podDefaults: [
          { name: 'access-ml-pipeline', matchLabels: { 'access-ml-pipeline': 'true' } },
          // A selector with several labels, and values other than "true".
          { name: 'ml-tools', matchLabels: { inject: 'ml-tools', tier: 'ml' } },
        ],
      })
    );
    expect(notebook.metadata.labels).toEqual({
      app: 'my-notebook',
      'access-ml-pipeline': 'true',
      inject: 'ml-tools',
      tier: 'ml',
    });
  });

  it('sets the VS Code annotations', () => {
    const { notebook } = buildNotebookObjects(formValues({ serverType: 'group-one' }));
    expect(notebook.metadata.annotations).toEqual({
      [SERVER_TYPE_ANNOTATION]: 'group-one',
      [URI_REWRITE_ANNOTATION]: '/',
    });
  });

  it('sets the RStudio annotations, including its root path header', () => {
    const { notebook } = buildNotebookObjects(formValues({ serverType: 'group-two' }));
    expect(notebook.metadata.annotations).toEqual({
      [SERVER_TYPE_ANNOTATION]: 'group-two',
      [URI_REWRITE_ANNOTATION]: '/',
      [HEADERS_ANNOTATION]: '{"X-RStudio-Root-Path":"/notebook/kubeflow-user/my-notebook/"}',
    });
  });

  it('trims spaces around the values', () => {
    const { notebook } = buildNotebookObjects(
      formValues({ image: ' my/image:1 ', cpu: ' 1 ', memoryGi: ' 2 ' })
    );
    const container = notebook.spec.template.spec.containers[0];
    expect(container.image).toBe('my/image:1');
    expect(container.resources?.requests).toEqual({ cpu: '1', memory: '2Gi' });
  });
});
