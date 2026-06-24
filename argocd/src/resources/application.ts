/*
 * Copyright 2025 The Kubernetes Authors
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

// Note: We import via K8s.cluster rather than the direct path
// '@kinvolk/headlamp-plugin/lib/k8s/cluster' because the latter is a virtual
// module that only resolves at build time (via Vite externals), not during
// Vitest test runs. Other plugins using the direct path do not have unit tests
// that exercise this import.
import { K8s } from '@kinvolk/headlamp-plugin/lib';

const { KubeObject } = K8s.cluster;
type KubeObjectInterface = K8s.cluster.KubeObjectInterface;

/** The Argo CD API group identifier used in CRD definitions. */
export const argocdApiGroup = 'argoproj.io';

/** The full API version string for Argo CD Application resources. */
export const argocdApiVersion = 'argoproj.io/v1alpha1';

/**
 * Represents the desired state (spec) of an Argo CD Application.
 *
 * @see https://argo-cd.readthedocs.io/en/stable/operator-manual/declarative-setup/#applications
 */
export interface ArgoApplicationSpec {
  /** The Argo CD project this application belongs to (e.g., "default"). */
  project: string;
  /** The Git or Helm source configuration for the application manifests. */
  source: {
    /** The URL of the Git repository or Helm chart repository. */
    repoURL: string;
    /** The Git branch, tag, or commit SHA to track (e.g., "HEAD", "main"). */
    targetRevision?: string;
    /** The directory path within the repository containing the manifests. */
    path?: string;
    /** The Helm chart name, if using a Helm chart source instead of a Git path. */
    chart?: string;
  };
  /** The target Kubernetes cluster and namespace for deployment. */
  destination: {
    /** The API server URL of the destination cluster. */
    server?: string;
    /** The name of the destination cluster (alternative to server URL). */
    name?: string;
    /** The target namespace in the destination cluster. */
    namespace?: string;
  };
}

/**
 * Represents the observed runtime state (status) of an Argo CD Application.
 *
 * This is populated by the Argo CD controller and reflects the live state
 * of the application in the target cluster.
 */
export interface ArgoApplicationStatus {
  /** The health assessment of the application. */
  health?: {
    /** The health status string (e.g., "Healthy", "Degraded", "Progressing", "Missing"). */
    status: string;
    /** An optional human-readable message providing additional health details. */
    message?: string;
  };
  /** The synchronization state between the desired and live state. */
  sync?: {
    /** The sync status string (e.g., "Synced", "OutOfSync"). */
    status: string;
  };
}

/**
 * The raw Kubernetes JSON shape for an Argo CD Application resource.
 *
 * Extends the base KubeObjectInterface with Argo CD-specific spec and status fields.
 */
export interface KubeArgoApplication extends KubeObjectInterface {
  /** The desired state of the Argo CD Application. */
  spec: ArgoApplicationSpec;
  /** The observed runtime state of the Argo CD Application, populated by the controller. */
  status?: ArgoApplicationStatus;
}

/**
 * Headlamp KubeObject wrapper for the Argo CD Application CRD.
 *
 * This class allows Headlamp to interact with Argo CD Application resources
 * using the standard Kubernetes API. It provides typed accessor properties
 * for commonly used spec and status fields.
 *
 * @see https://argo-cd.readthedocs.io/en/stable/user-guide/application-specification/
 */
export class ArgoApplication extends KubeObject<KubeArgoApplication> {
  static kind = 'Application';
  static apiName = 'applications';
  static apiVersion = argocdApiVersion;
  static isNamespaced = true;

  // No custom detailsRoute yet; rely on Headlamp defaults until a detail view is implemented.

  /** Returns the application's desired state specification. */
  get spec(): ArgoApplicationSpec {
    return this.jsonData.spec;
  }

  /** Returns the application's observed runtime status, or undefined if not yet available. */
  get status(): ArgoApplicationStatus | undefined {
    return this.jsonData.status;
  }

  /** Returns the Argo CD project name this application belongs to. Defaults to "default". */
  get project(): string {
    return this.spec.project || 'default';
  }

  /** Returns the Git or Helm repository URL for the application source. */
  get repoURL(): string {
    return this.spec.source?.repoURL || '';
  }

  /** Returns the target Git revision (branch, tag, or SHA). Defaults to "HEAD". */
  get targetRevision(): string {
    return this.spec.source?.targetRevision || 'HEAD';
  }

  /** Returns the manifest path within the repository, or the Helm chart name. */
  get path(): string {
    return this.spec.source?.path || this.spec.source?.chart || '';
  }

  /** Returns the destination cluster API server URL or cluster name. */
  get destinationServer(): string {
    return this.spec.destination?.server || this.spec.destination?.name || '-';
  }

  /** Returns the destination namespace in the target cluster. Defaults to "default". */
  get destinationNamespace(): string {
    return this.spec.destination?.namespace || 'default';
  }

  /** Returns the health status string (e.g., "Healthy", "Degraded"). Defaults to "Unknown". */
  get healthStatus(): string {
    return this.status?.health?.status || 'Unknown';
  }

  /** Returns the sync status string (e.g., "Synced", "OutOfSync"). Defaults to "Unknown". */
  get syncStatus(): string {
    return this.status?.sync?.status || 'Unknown';
  }
}
