import {
  buildNotebookObjects,
  defaultLimit,
  getDefaultNotebookFormValues,
  HEADERS_ANNOTATION,
  NotebookFormValues,
  SERVER_TYPE_ANNOTATION,
  URI_REWRITE_ANNOTATION,
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

  it.each(['My-Notebook', 'my_notebook', '-notebook', 'notebook-', 'my.notebook'])(
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

// ── validateNotebookForm ───────────────────────────────────────────────────────

describe('validateNotebookForm', () => {
  it('accepts the defaults once a name is set', () => {
    expect(validateNotebookForm(formValues())).toEqual({});
  });

  it('checks the format of a typed namespace', () => {
    expect(validateNotebookForm(formValues({ namespace: 'Team_A' })).namespace).toBe('invalidName');
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
  it('builds the same Notebook as the Kubeflow web app for the defaults', () => {
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
                  { name: 'my-notebook-workspace', mountPath: '/home/jovyan' },
                  { name: 'dshm', mountPath: '/dev/shm' },
                ],
              },
            ],
            volumes: [
              {
                name: 'my-notebook-workspace',
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
    const { notebook, workspacePvc } = buildNotebookObjects(
      formValues({
        workspace: { type: 'existing', claimName: 'shared-data', sizeGi: '', mountPath: '/data' },
        enableSharedMemory: false,
      })
    );
    expect(workspacePvc).toBeUndefined();
    expect(notebook.spec.template.spec.volumes).toEqual([
      { name: 'shared-data', persistentVolumeClaim: { claimName: 'shared-data' } },
    ]);
    expect(notebook.spec.template.spec.containers[0].volumeMounts).toEqual([
      { name: 'shared-data', mountPath: '/data' },
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

  it('labels the Notebook for each selected PodDefault', () => {
    const { notebook } = buildNotebookObjects(
      formValues({ podDefaultLabels: ['access-ml-pipeline', 'add-gcp-secret'] })
    );
    expect(notebook.metadata.labels).toEqual({
      app: 'my-notebook',
      'access-ml-pipeline': 'true',
      'add-gcp-secret': 'true',
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
