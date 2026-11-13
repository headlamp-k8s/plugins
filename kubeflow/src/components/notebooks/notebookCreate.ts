/**
 * Copyright 2025 The Headlamp Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Builds the objects for a new Notebook server from the create form's values.
 *
 * The defaults and the generated objects follow the Kubeflow Notebooks web app, so a
 * notebook created here looks the same as one created from the Kubeflow dashboard:
 * - template: components/crud-web-apps/jupyter/backend/apps/common/yaml/notebook_template.yaml
 * - logic: components/crud-web-apps/jupyter/backend/apps/common/form.py and volumes.py
 * - defaults: components/crud-web-apps/jupyter/manifests/base/configs/spawner_ui_config.yaml
 * in https://github.com/kubeflow/notebooks (notebooks-v1 branch).
 */

import { KubeflowNotebook } from '../../resources/notebook';

/** The three server types of the Kubeflow web app: Jupyter, VS Code and RStudio. */
export type NotebookServerType = 'jupyter' | 'group-one' | 'group-two';

export const SERVER_TYPE_ANNOTATION = 'notebooks.kubeflow.org/server-type';
export const URI_REWRITE_ANNOTATION = 'notebooks.kubeflow.org/http-rewrite-uri';
export const HEADERS_ANNOTATION = 'notebooks.kubeflow.org/http-headers-request-set';

const IMAGE_REGISTRY = 'ghcr.io/kubeflow/kubeflow/notebook-servers';

/** Image presets per server type. The first image of each type is its default. */
export const NOTEBOOK_IMAGES: Record<NotebookServerType, string[]> = {
  jupyter: [
    `${IMAGE_REGISTRY}/jupyter-scipy:latest`,
    `${IMAGE_REGISTRY}/jupyter-pytorch-full:latest`,
    `${IMAGE_REGISTRY}/jupyter-pytorch-cuda-full:latest`,
    `${IMAGE_REGISTRY}/jupyter-tensorflow-full:latest`,
    `${IMAGE_REGISTRY}/jupyter-tensorflow-cuda-full:latest`,
  ],
  'group-one': [`${IMAGE_REGISTRY}/codeserver-python:latest`],
  'group-two': [`${IMAGE_REGISTRY}/rstudio-tidyverse:latest`],
};

/** GPU vendors, keyed by the resource name used in the container limits. */
export const GPU_VENDORS: Array<{ limitsKey: string; label: string }> = [
  { limitsKey: 'nvidia.com/gpu', label: 'NVIDIA' },
  { limitsKey: 'amd.com/gpu', label: 'AMD' },
  { limitsKey: 'habana.ai/gaudi', label: 'Intel Gaudi' },
];

/** When no limit is given, the limit is the request times this factor, as in the web app. */
export const LIMIT_FACTOR = 1.2;

/** The service account that Kubeflow Profiles create in every profile namespace. */
export const DEFAULT_SERVICE_ACCOUNT = 'default-editor';

/** Default mount path of the workspace volume. */
export const WORKSPACE_MOUNT_PATH = '/home/jovyan';

/**
 * Longest allowed name. The Notebook controller creates a StatefulSet with the Notebook's
 * name, and a StatefulSet name longer than 52 characters makes its pods fail to start
 * (the controller-revision-hash label it adds would exceed 63 characters).
 */
export const MAX_NAME_LENGTH = 52;

/** Longest allowed namespace name (a DNS-1123 label). */
export const MAX_NAMESPACE_LENGTH = 63;

export interface NotebookWorkspace {
  /** `new` creates a PVC named `<notebook>-workspace`; `existing` mounts a PVC by name. */
  type: 'new' | 'existing' | 'none';
  /** Size of a new PVC, in Gi. */
  sizeGi: string;
  /** Name of the existing PVC to mount. */
  claimName: string;
  mountPath: string;
}

export interface NotebookFormValues {
  name: string;
  namespace: string;
  serverType: NotebookServerType;
  image: string;
  /** CPU request in cores, e.g. "0.5". */
  cpu: string;
  /** CPU limit in cores. Empty means request x LIMIT_FACTOR. */
  cpuLimit: string;
  /** Memory request in Gi, e.g. "1". */
  memoryGi: string;
  /** Memory limit in Gi. Empty means request x LIMIT_FACTOR. */
  memoryLimitGi: string;
  /** GPU resource name from GPU_VENDORS, or empty for no GPU. */
  gpuVendor: string;
  gpuCount: string;
  workspace: NotebookWorkspace;
  /** Labels of the PodDefaults to apply. Each one is set to "true" on the Notebook. */
  podDefaultLabels: string[];
  /** Mount a memory-backed /dev/shm, which PyTorch data loaders need. */
  enableSharedMemory: boolean;
}

/** Form values with the web app's defaults. */
export function getDefaultNotebookFormValues(namespace = ''): NotebookFormValues {
  return {
    name: '',
    namespace,
    serverType: 'jupyter',
    image: NOTEBOOK_IMAGES.jupyter[0],
    cpu: '0.5',
    cpuLimit: '',
    memoryGi: '1',
    memoryLimitGi: '',
    gpuVendor: '',
    gpuCount: '1',
    workspace: { type: 'new', sizeGi: '5', claimName: '', mountPath: WORKSPACE_MOUNT_PATH },
    podDefaultLabels: [],
    enableSharedMemory: true,
  };
}

/** Field errors, keyed by field. Values are error codes that the form turns into messages. */
export type NotebookFormErrors = Partial<
  Record<
    | 'name'
    | 'namespace'
    | 'image'
    | 'cpu'
    | 'cpuLimit'
    | 'memoryGi'
    | 'memoryLimitGi'
    | 'gpuCount'
    | 'workspaceSize'
    | 'workspaceClaimName'
    | 'workspaceMountPath',
    NotebookFormErrorCode
  >
>;

export type NotebookFormErrorCode =
  | 'required'
  | 'invalidName'
  | 'nameTooLong'
  | 'notPositiveNumber'
  | 'notPositiveInteger'
  | 'limitBelowRequest'
  | 'notAbsolutePath';

// A DNS-1123 label: lowercase letters, digits and '-', starting and ending with a letter or digit.
const DNS_1123_LABEL = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;
const POSITIVE_NUMBER = /^(\d+(\.\d*)?|\.\d+)$/;
const POSITIVE_INTEGER = /^\d+$/;

function isPositiveNumber(value: string): boolean {
  return POSITIVE_NUMBER.test(value.trim()) && Number(value) > 0;
}

function isPositiveInteger(value: string): boolean {
  return POSITIVE_INTEGER.test(value.trim()) && Number(value) > 0;
}

/** Validates a Kubernetes object name (DNS-1123 label). Returns an error code or undefined. */
export function validateName(
  name: string,
  maxLength: number = MAX_NAME_LENGTH
): NotebookFormErrorCode | undefined {
  if (!name) return 'required';
  if (name.length > maxLength) return 'nameTooLong';
  if (!DNS_1123_LABEL.test(name)) return 'invalidName';
  return undefined;
}

function validateRequestAndLimit(
  request: string,
  limit: string
): [NotebookFormErrorCode | undefined, NotebookFormErrorCode | undefined] {
  if (!request.trim()) return ['required', undefined];
  if (!isPositiveNumber(request)) return ['notPositiveNumber', undefined];
  if (!limit.trim()) return [undefined, undefined];
  if (!isPositiveNumber(limit)) return [undefined, 'notPositiveNumber'];
  if (Number(limit) < Number(request)) return [undefined, 'limitBelowRequest'];
  return [undefined, undefined];
}

/** Returns the errors in the form. An empty object means the form is valid. */
export function validateNotebookForm(values: NotebookFormValues): NotebookFormErrors {
  const errors: NotebookFormErrors = {};

  errors.name = validateName(values.name);
  // The namespace can be typed in (users who can't list namespaces), so check its format too.
  errors.namespace = validateName(values.namespace, MAX_NAMESPACE_LENGTH);
  if (!values.image.trim()) errors.image = 'required';

  [errors.cpu, errors.cpuLimit] = validateRequestAndLimit(values.cpu, values.cpuLimit);
  [errors.memoryGi, errors.memoryLimitGi] = validateRequestAndLimit(
    values.memoryGi,
    values.memoryLimitGi
  );

  if (values.gpuVendor && !isPositiveInteger(values.gpuCount)) {
    errors.gpuCount = 'notPositiveInteger';
  }

  const { workspace } = values;
  if (workspace.type === 'new' && !isPositiveInteger(workspace.sizeGi)) {
    errors.workspaceSize = 'notPositiveInteger';
  }
  if (workspace.type === 'existing' && !workspace.claimName) {
    errors.workspaceClaimName = 'required';
  }
  if (workspace.type !== 'none' && !workspace.mountPath.startsWith('/')) {
    errors.workspaceMountPath = 'notAbsolutePath';
  }

  // Drop the fields that have no error, so `{}` means valid.
  (Object.keys(errors) as Array<keyof NotebookFormErrors>).forEach(key => {
    if (errors[key] === undefined) delete errors[key];
  });
  return errors;
}

/**
 * Request x LIMIT_FACTOR, rounded to one decimal like the web app does. Rounding can take a
 * small request below itself (0.01 x 1.2 rounds to 0), so the result is never below the request.
 */
export function defaultLimit(request: string): string {
  const value = Number(request);
  const limit = Math.round(value * LIMIT_FACTOR * 10) / 10;
  return String(Math.max(limit, value));
}

/** Name of the PVC created for a new workspace volume, as in the web app. */
export function workspacePvcName(notebookName: string): string {
  return `${notebookName}-workspace`;
}

export interface PersistentVolumeClaimObject {
  apiVersion: 'v1';
  kind: 'PersistentVolumeClaim';
  metadata: { name: string; namespace: string };
  spec: {
    accessModes: string[];
    resources: { requests: { storage: string } };
  };
}

export interface NewNotebookObjects {
  notebook: KubeflowNotebook;
  /** The workspace PVC to create before the Notebook, if a new one was requested. */
  workspacePvc?: PersistentVolumeClaimObject;
}

/**
 * Builds the Notebook (and the workspace PVC, if any) for valid form values.
 * Call {@link validateNotebookForm} first.
 */
export function buildNotebookObjects(values: NotebookFormValues): NewNotebookObjects {
  const name = values.name;
  const namespace = values.namespace;

  const labels: Record<string, string> = { app: name };
  values.podDefaultLabels.forEach(label => {
    labels[label] = 'true';
  });

  const annotations: Record<string, string> = { [SERVER_TYPE_ANNOTATION]: values.serverType };
  if (values.serverType === 'group-one' || values.serverType === 'group-two') {
    annotations[URI_REWRITE_ANNOTATION] = '/';
  }
  if (values.serverType === 'group-two') {
    annotations[HEADERS_ANNOTATION] = JSON.stringify({
      'X-RStudio-Root-Path': `/notebook/${namespace}/${name}/`,
    });
  }

  const cpu = values.cpu.trim();
  const memory = values.memoryGi.trim();
  const limits: Record<string, string> = {
    cpu: values.cpuLimit.trim() || defaultLimit(cpu),
    memory: `${values.memoryLimitGi.trim() || defaultLimit(memory)}Gi`,
  };
  if (values.gpuVendor) {
    limits[values.gpuVendor] = values.gpuCount.trim();
  }

  const volumes: Array<Record<string, unknown>> = [];
  const volumeMounts: Array<{ name: string; mountPath: string }> = [];
  let workspacePvc: PersistentVolumeClaimObject | undefined;

  const { workspace } = values;
  if (workspace.type !== 'none') {
    const claimName =
      workspace.type === 'new' ? workspacePvcName(name) : workspace.claimName.trim();
    volumes.push({ name: claimName, persistentVolumeClaim: { claimName } });
    volumeMounts.push({ name: claimName, mountPath: workspace.mountPath });

    if (workspace.type === 'new') {
      workspacePvc = {
        apiVersion: 'v1',
        kind: 'PersistentVolumeClaim',
        metadata: { name: claimName, namespace },
        spec: {
          accessModes: ['ReadWriteOnce'],
          resources: { requests: { storage: `${workspace.sizeGi.trim()}Gi` } },
        },
      };
    }
  }

  if (values.enableSharedMemory) {
    volumes.push({ name: 'dshm', emptyDir: { medium: 'Memory' } });
    volumeMounts.push({ name: 'dshm', mountPath: '/dev/shm' });
  }

  const notebook: KubeflowNotebook = {
    apiVersion: 'kubeflow.org/v1',
    kind: 'Notebook',
    metadata: { name, namespace, labels, annotations } as KubeflowNotebook['metadata'],
    spec: {
      template: {
        spec: {
          serviceAccountName: DEFAULT_SERVICE_ACCOUNT,
          containers: [
            {
              name,
              image: values.image.trim(),
              imagePullPolicy: 'IfNotPresent',
              resources: { requests: { cpu, memory: `${memory}Gi` }, limits },
              volumeMounts,
            },
          ],
          volumes,
        },
      },
    },
  };

  return { notebook, workspacePvc };
}
