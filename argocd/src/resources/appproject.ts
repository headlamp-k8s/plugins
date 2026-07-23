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

import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { argocdApiVersion } from './application';

const { KubeObject } = K8s.cluster;
type KubeObjectInterface = K8s.cluster.KubeObjectInterface;

export interface AppProjectDestination {
  /** Server specifies the URL of the target cluster's Kubernetes control plane API. */
  server?: string;
  /** Name is an alternate way of specifying the target cluster by its symbolic name. */
  name?: string;
  /** Namespace specifies the target namespace on the destination cluster. */
  namespace?: string;
}

export interface AppProjectRole {
  /** Name is a project-unique name of the role. */
  name: string;
  /** Description is a human-readable description of the role. */
  description?: string;
  /** Policies stores a list of casbin formatted strings that define access policies for the role in the project. */
  policies?: string[];
  /** Groups are a list of OIDC group claims bound to this role. */
  groups?: string[];
}

export interface GroupKind {
  /** Group is the API group of the resource (e.g. "apps"). */
  group: string;
  /** Kind is the API kind of the resource (e.g. "Deployment"). */
  kind: string;
}

export interface ArgoAppProjectSpec {
  /** Description is a human-readable description of the project. */
  description?: string;
  /** SourceRepos contains a list of repository URLs which can be used for deployment in this project. */
  sourceRepos?: string[];
  /** Destinations contains a list of destinations (cluster/namespace) to which apps in this project can be deployed. */
  destinations?: AppProjectDestination[];
  /** ClusterResourceWhitelist contains a list of cluster-scoped resources allowed to be deployed in this project. */
  clusterResourceWhitelist?: GroupKind[];
  /** ClusterResourceBlacklist contains a list of cluster-scoped resources forbidden from being deployed in this project. */
  clusterResourceBlacklist?: GroupKind[];
  /** NamespaceResourceWhitelist contains a list of namespace-scoped resources allowed to be deployed in this project. */
  namespaceResourceWhitelist?: GroupKind[];
  /** NamespaceResourceBlacklist contains a list of namespace-scoped resources forbidden from being deployed in this project. */
  namespaceResourceBlacklist?: GroupKind[];
  /** Roles are user defined RBAC roles associated with this project. */
  roles?: AppProjectRole[];
}

export interface KubeArgoAppProject extends KubeObjectInterface {
  /** Spec represents the desired state of the AppProject. */
  spec: ArgoAppProjectSpec;
}

/**
 * Headlamp KubeObject wrapper for the Argo CD AppProject CRD.
 *
 * AppProjects define security boundaries — which Git repos, clusters,
 * namespaces, and resource kinds an Application is allowed to use.
 */
export class ArgoAppProject extends KubeObject<KubeArgoAppProject> {
  static kind = 'AppProject';
  static apiName = 'appprojects';
  static apiVersion = argocdApiVersion;
  static isNamespaced = true;

  static get detailsRoute() {
    return '/argocd/projects/:namespace/:name';
  }

  get spec(): ArgoAppProjectSpec {
    return this.jsonData.spec;
  }

  get description(): string {
    return this.spec.description || '';
  }

  get sourceRepos(): string[] {
    return this.spec.sourceRepos || [];
  }

  get destinations(): AppProjectDestination[] {
    return this.spec.destinations || [];
  }

  get roles(): AppProjectRole[] {
    return this.spec.roles || [];
  }

  get clusterResourceWhitelist(): GroupKind[] {
    return this.spec.clusterResourceWhitelist || [];
  }

  get namespaceResourceWhitelist(): GroupKind[] {
    return this.spec.namespaceResourceWhitelist || [];
  }
}
