/**
 * Shared mock data fixtures for Kubeflow Storybook stories and tests.
 *
 * All data here mirrors the exact shape of real Kubernetes CRD objects
 * as returned by the Kubeflow API.  Nothing is invented — each fixture
 * is modeled after actual `kubectl get <resource> -o json` output.
 */

// ─── Notebook fixtures ────────────────────────────────────────────────────────

export const notebookRunning = {
  apiVersion: 'kubeflow.org/v1',
  kind: 'Notebook',
  metadata: {
    name: 'jupyter-data-science',
    namespace: 'kubeflow-user',
    creationTimestamp: '2026-03-25T10:00:00Z',
    uid: 'nb-1111-2222-3333-4444',
  },
  spec: {
    template: {
      spec: {
        containers: [
          {
            name: 'jupyter-data-science',
            image: 'kubeflownotebookswg/jupyter-scipy:v1.8.0',
            ports: [{ name: 'notebook-port', containerPort: 8888, protocol: 'TCP' }],
            resources: {
              requests: { cpu: '500m', memory: '1Gi' },
              limits: { cpu: '1', memory: '2Gi' },
            },
            env: [
              { name: 'NB_PREFIX', value: '/notebook/kubeflow-user/jupyter-data-science' },
              {
                name: 'AWS_ACCESS_KEY_ID',
                valueFrom: { secretKeyRef: { name: 'aws-secret', key: 'access-key' } },
              },
            ],
            volumeMounts: [
              { name: 'workspace', mountPath: '/home/jovyan', readOnly: false },
              { name: 'shm', mountPath: '/dev/shm' },
            ],
          },
        ],
        volumes: [
          { name: 'workspace', persistentVolumeClaim: { claimName: 'jupyter-workspace-pvc' } },
          { name: 'shm', emptyDir: { medium: 'Memory' } },
        ],
      },
    },
  },
  status: {
    readyReplicas: 1,
    conditions: [
      {
        type: 'Running',
        status: 'True',
        lastTransitionTime: '2026-03-25T10:02:00Z',
      },
    ],
    containerState: {
      running: { startedAt: '2026-03-25T10:01:30Z' },
    },
  },
};

export const notebookPending = {
  apiVersion: 'kubeflow.org/v1',
  kind: 'Notebook',
  metadata: {
    name: 'vscode-ml-dev',
    namespace: 'kubeflow-user',
    creationTimestamp: '2026-03-28T14:00:00Z',
    uid: 'nb-5555-6666-7777-8888',
  },
  spec: {
    template: {
      spec: {
        containers: [
          {
            name: 'vscode-ml-dev',
            image: 'kubeflownotebookswg/codeserver-python:v1.8.0',
            ports: [{ name: 'notebook-port', containerPort: 8888 }],
            resources: {
              requests: { cpu: '1', memory: '4Gi' },
              limits: { cpu: '2', memory: '8Gi', 'nvidia.com/gpu': '1' },
            },
            volumeMounts: [{ name: 'workspace', mountPath: '/home/coder' }],
          },
        ],
        volumes: [
          { name: 'workspace', persistentVolumeClaim: { claimName: 'vscode-workspace-pvc' } },
        ],
        tolerations: [{ key: 'nvidia.com/gpu', operator: 'Exists', effect: 'NoSchedule' }],
      },
    },
  },
  status: {
    containerState: {
      waiting: { reason: 'ContainerCreating' },
    },
  },
};

export const notebookFailed = {
  apiVersion: 'kubeflow.org/v1',
  kind: 'Notebook',
  metadata: {
    name: 'rstudio-analysis',
    namespace: 'research-team',
    creationTimestamp: '2026-03-20T08:00:00Z',
    uid: 'nb-aaaa-bbbb-cccc-dddd',
  },
  spec: {
    template: {
      spec: {
        containers: [
          {
            name: 'rstudio-analysis',
            image: 'kubeflownotebookswg/rstudio-tidyverse:v1.8.0',
            ports: [{ name: 'notebook-port', containerPort: 8888 }],
            resources: {
              requests: { cpu: '250m', memory: '512Mi' },
              limits: { cpu: '500m', memory: '1Gi' },
            },
          },
        ],
        volumes: [],
      },
    },
  },
  status: {
    conditions: [
      {
        type: 'Failed',
        status: 'True',
        reason: 'ImagePullBackOff',
        message: 'Back-off pulling image "kubeflownotebookswg/rstudio-tidyverse:v1.8.0"',
        lastTransitionTime: '2026-03-20T08:05:00Z',
      },
    ],
    containerState: {
      waiting: {
        reason: 'ImagePullBackOff',
        message: 'Back-off pulling image "kubeflownotebookswg/rstudio-tidyverse:v1.8.0"',
      },
    },
  },
};

export const notebookTerminated = {
  apiVersion: 'kubeflow.org/v1',
  kind: 'Notebook',
  metadata: {
    name: 'custom-ml-env',
    namespace: 'kubeflow-user',
    creationTimestamp: '2026-03-22T12:00:00Z',
    uid: 'nb-eeee-ffff-0000-1111',
  },
  spec: {
    template: {
      spec: {
        containers: [
          {
            name: 'custom-ml-env',
            image: 'my-registry/custom-ml:v2.1',
            resources: {
              requests: { cpu: '2', memory: '8Gi' },
              limits: { cpu: '4', memory: '16Gi' },
            },
          },
          {
            name: 'sidecar-proxy',
            image: 'envoyproxy/envoy:v1.28.0',
          },
        ],
        volumes: [
          { name: 'data', persistentVolumeClaim: { claimName: 'shared-data' } },
          { name: 'config', configMap: { name: 'ml-config' } },
          { name: 'cache', emptyDir: {} },
        ],
      },
    },
  },
  status: {
    containerState: {
      terminated: { reason: 'OOMKilled', exitCode: 137 },
    },
  },
};

export const allNotebooks = [notebookRunning, notebookPending, notebookFailed, notebookTerminated];

// ─── Profile fixtures ─────────────────────────────────────────────────────────

export const profileReady = {
  apiVersion: 'kubeflow.org/v1',
  kind: 'Profile',
  metadata: {
    name: 'kubeflow-user',
    creationTimestamp: '2026-03-01T00:00:00Z',
    uid: 'prof-1111-2222',
  },
  spec: {
    owner: { kind: 'User', name: 'user@example.com' },
    resourceQuotaSpec: {
      hard: {
        cpu: '8',
        memory: '32Gi',
        'requests.nvidia.com/gpu': '2',
      },
    },
    plugins: [
      {
        kind: 'WorkloadIdentity',
        spec: { awsIamRole: 'arn:aws:iam::123456789012:role/kubeflow-user' },
      },
    ],
  },
  status: {
    conditions: [{ type: 'Ready', status: 'True', lastTransitionTime: '2026-03-01T00:01:00Z' }],
  },
};

export const profileNotReady = {
  apiVersion: 'kubeflow.org/v1',
  kind: 'Profile',
  metadata: {
    name: 'research-team',
    creationTimestamp: '2026-03-15T09:00:00Z',
    uid: 'prof-3333-4444',
  },
  spec: {
    owner: { kind: 'Group', name: 'research-group' },
    resourceQuotaSpec: {
      hard: {
        cpu: '16',
        memory: '64Gi',
      },
    },
  },
  status: {
    conditions: [
      {
        type: 'Ready',
        status: 'False',
        reason: 'NamespaceQuotaExceeded',
        message: 'Resource quota limit reached for namespace research-team',
      },
    ],
  },
};

export const profileNoConditions = {
  apiVersion: 'kubeflow.org/v1',
  kind: 'Profile',
  metadata: {
    name: 'staging-env',
    creationTimestamp: '2026-03-20T12:00:00Z',
    uid: 'prof-5555-6666',
  },
  spec: {
    owner: { kind: 'User', name: 'admin@example.com' },
  },
  status: {},
};

export const allProfiles = [profileReady, profileNotReady, profileNoConditions];

// ─── PodDefault fixtures ──────────────────────────────────────────────────────

export const podDefaultAwsCreds = {
  apiVersion: 'kubeflow.org/v1alpha1',
  kind: 'PodDefault',
  metadata: {
    name: 'add-aws-secret',
    namespace: 'kubeflow-user',
    creationTimestamp: '2026-03-10T06:00:00Z',
    uid: 'pd-1111-2222',
  },
  spec: {
    desc: 'Add AWS credentials for S3 access',
    selector: { matchLabels: { 'aws-creds': 'true' } },
    env: [
      {
        name: 'AWS_ACCESS_KEY_ID',
        valueFrom: { secretKeyRef: { name: 'aws-secret', key: 'access-key' } },
      },
      {
        name: 'AWS_SECRET_ACCESS_KEY',
        valueFrom: { secretKeyRef: { name: 'aws-secret', key: 'secret-key' } },
      },
    ],
  },
};

export const podDefaultGcpCreds = {
  apiVersion: 'kubeflow.org/v1alpha1',
  kind: 'PodDefault',
  metadata: {
    name: 'add-gcp-secret',
    namespace: 'kubeflow-user',
    creationTimestamp: '2026-03-10T06:00:00Z',
    uid: 'pd-3333-4444',
  },
  spec: {
    desc: 'Add GCP service account credentials',
    selector: { matchLabels: { 'gcp-creds': 'true' } },
    env: [{ name: 'GOOGLE_APPLICATION_CREDENTIALS', value: '/secret/gcp/key.json' }],
    volumes: [{ name: 'gcp-secret', secret: { secretName: 'gcp-sa-key' } }],
    volumeMounts: [{ name: 'gcp-secret', mountPath: '/secret/gcp' }],
    annotations: { 'iam.gke.io/gcp-service-account': 'ml-sa@project.iam.gserviceaccount.com' },
    serviceAccountName: 'ml-service-account',
  },
};

export const podDefaultEmpty = {
  apiVersion: 'kubeflow.org/v1alpha1',
  kind: 'PodDefault',
  metadata: {
    name: 'no-injections',
    namespace: 'kubeflow-user',
    creationTimestamp: '2026-03-12T10:00:00Z',
    uid: 'pd-5555-6666',
  },
  spec: {
    desc: 'Empty PodDefault for testing',
    selector: { matchLabels: { 'test-label': 'true' } },
  },
};

export const allPodDefaults = [podDefaultAwsCreds, podDefaultGcpCreds, podDefaultEmpty];
