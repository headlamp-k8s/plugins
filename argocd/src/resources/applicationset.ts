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
import { ArgoApplicationSpec, argocdApiGroup, argocdApiVersion, SourceSpec } from './application';

const { KubeObject } = K8s.cluster;
type KubeObjectInterface = K8s.cluster.KubeObjectInterface;

export interface ApplicationSetCondition {
  type: string;
  status?: string;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
}

export interface ApplicationSetResource {
  group?: string;
  version?: string;
  kind?: string;
  namespace?: string;
  name?: string;
}

export interface ApplicationSetTemplate {
  metadata?: { name?: string };
  spec?: Partial<ArgoApplicationSpec>;
}

export interface ApplicationSetStatus {
  health?: { status?: string };
  conditions?: ApplicationSetCondition[];
  resources?: ApplicationSetResource[];
  resourcesCount?: number;
  applicationStatus?: ApplicationSetProgressiveSyncStatus[];
}

export interface ApplicationSetProgressiveSyncStatus {
  application: string;
  status?: string;
  step?: string;
  message?: string;
  lastTransitionTime?: string;
}

export interface ArgoApplicationSetSpec {
  generators?: Record<string, unknown>[];
  template?: ApplicationSetTemplate;
}

export interface KubeArgoApplicationSet extends KubeObjectInterface {
  spec: ArgoApplicationSetSpec;
  status?: ApplicationSetStatus;
}

type GeneratorValue = Record<string, unknown>;

function asRecord(value: unknown): GeneratorValue | undefined {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as GeneratorValue)
    : undefined;
}

function generatorChildren(value: unknown): GeneratorValue[] {
  const record = asRecord(value);
  const generators = record?.generators;
  return Array.isArray(generators)
    ? generators
        .map(asRecord)
        .filter((generator): generator is GeneratorValue => Boolean(generator))
    : [];
}

/** Returns a repository identifier without credentials, query parameters, or fragments. */
export function safeRepositoryIdentifier(value: unknown): string {
  if (typeof value !== 'string') return '';
  const repository = value.trim();
  if (!repository) return '';

  try {
    const url = new URL(repository);
    url.username = '';
    url.password = '';
    url.search = '';
    url.hash = '';
    return url.toString();
  } catch {
    const withoutQueryOrFragment = repository.split(/[?#]/, 1)[0];
    const withoutUrlUserInfo = withoutQueryOrFragment.replace(
      /^([a-z][a-z\d+.-]*:\/\/)[^/@\s]*@/i,
      '$1'
    );
    return withoutUrlUserInfo.replace(/^[^@\s]+@(?=[^/\s]+[:/])/, '');
  }
}

function namedGeneratorSummary(name: string, value: unknown): string {
  const record = asRecord(value);
  if (!record) return name;

  if (name === 'Git') {
    const directories = Array.isArray(record.directories) ? record.directories.length : 0;
    const files = Array.isArray(record.files) ? record.files.length : 0;
    const repo = safeRepositoryIdentifier(record.repoURL);
    const count = directories + files;
    return [name, repo, count ? `${count} path${count === 1 ? '' : 's'}` : '']
      .filter(Boolean)
      .join(' · ');
  }

  if (name === 'Plugin') {
    const configMapRef = asRecord(record.configMapRef);
    const configMapName =
      typeof record.configMapRef === 'string'
        ? record.configMapRef
        : typeof configMapRef?.name === 'string'
        ? configMapRef.name
        : '';
    return configMapName ? `${name} · ${configMapName}` : name;
  }

  if (name === 'SCM Provider') {
    const github = asRecord(record.github);
    return typeof github?.organization === 'string' ? `${name} · ${github.organization}` : name;
  }

  return name;
}

/** Returns a short, credential-safe description of an ApplicationSet generator. */
export function getGeneratorSummary(generator: GeneratorValue): string {
  const knownGenerators: [string, string][] = [
    ['list', 'List'],
    ['clusters', 'Clusters'],
    ['git', 'Git'],
    ['scmProvider', 'SCM Provider'],
    ['pullRequest', 'Pull Request'],
    ['clusterDecisionResource', 'Cluster Decision Resource'],
    ['plugin', 'Plugin'],
  ];

  for (const [key, label] of knownGenerators) {
    if (key in generator) return namedGeneratorSummary(label, generator[key]);
  }

  for (const [key, label] of [
    ['matrix', 'Matrix'],
    ['merge', 'Merge'],
  ] as [string, string][]) {
    if (key in generator) {
      const children = generatorChildren(generator[key]).map(getGeneratorSummary);
      return children.length ? `${label} (${children.join(' + ')})` : label;
    }
  }

  return 'Unknown generator';
}

export function getApplicationSetHealthStatus(status?: ApplicationSetStatus): string {
  if (status?.health?.status) return status.health.status;
  const trueConditions = new Set(
    (status?.conditions ?? [])
      .filter(condition => condition.status === 'True')
      .map(condition => condition.type)
  );
  if (trueConditions.has('ErrorOccurred')) return 'Degraded';
  if (trueConditions.has('RolloutProgressing')) return 'Progressing';
  if (trueConditions.has('ResourcesUpToDate')) return 'Healthy';
  return 'Unknown';
}

/** Applies the controller, status-resource, then verified-live count precedence. */
export function getGeneratedApplicationCount(
  status?: ApplicationSetStatus,
  verifiedLiveCount?: number
): number | undefined {
  if (typeof status?.resourcesCount === 'number') return status.resourcesCount;
  if (status?.resources) return status.resources.length;
  return verifiedLiveCount;
}

/**
 * Determines whether an Application is generated by this ApplicationSet.
 * The controller-created owner reference UID is the only accepted identity.
 */
export function isGeneratedApplication(
  application: {
    cluster?: string;
    metadata: {
      namespace?: string;
      ownerReferences?: Array<{ apiVersion?: string; kind?: string; uid?: string }>;
    };
  },
  applicationSet: { cluster?: string; metadata: { namespace?: string; uid?: string } }
): boolean {
  if (
    !applicationSet.metadata.uid ||
    application.cluster !== applicationSet.cluster ||
    application.metadata.namespace !== applicationSet.metadata.namespace
  ) {
    return false;
  }

  return (application.metadata.ownerReferences ?? []).some(
    owner =>
      owner.apiVersion?.split('/')[0] === argocdApiGroup &&
      owner.kind === 'ApplicationSet' &&
      owner.uid === applicationSet.metadata.uid
  );
}

/** Headlamp KubeObject wrapper for the read-only Argo CD ApplicationSet CRD. */
export class ArgoApplicationSet extends KubeObject<KubeArgoApplicationSet> {
  static kind = 'ApplicationSet';
  static apiName = 'applicationsets';
  static apiVersion = argocdApiVersion;
  static isNamespaced = true;

  static get detailsRoute() {
    return '/argocd/applicationsets/:namespace/:name';
  }

  get spec(): ArgoApplicationSetSpec {
    return this.jsonData.spec;
  }

  get status(): ApplicationSetStatus | undefined {
    return this.jsonData.status;
  }

  get generators(): GeneratorValue[] {
    return this.spec.generators ?? [];
  }

  get generatorSummaries(): string[] {
    return this.generators.map(getGeneratorSummary);
  }

  get template(): ApplicationSetTemplate | undefined {
    return this.spec.template;
  }

  get templateSources(): SourceSpec[] {
    const spec = this.template?.spec;
    return spec?.sources ?? (spec?.source ? [spec.source] : []);
  }

  get templateProject(): string {
    return this.template?.spec?.project ?? '-';
  }

  get templateDestination(): ArgoApplicationSpec['destination'] | undefined {
    return this.template?.spec?.destination;
  }

  get conditions(): ApplicationSetCondition[] {
    return this.status?.conditions ?? [];
  }

  get progressiveSyncStatus(): ApplicationSetProgressiveSyncStatus[] {
    return this.status?.applicationStatus ?? [];
  }

  get healthStatus(): string {
    return getApplicationSetHealthStatus(this.status);
  }

  get generatedApplicationCount(): number | undefined {
    return getGeneratedApplicationCount(this.status);
  }
}

export { argocdApiGroup };
