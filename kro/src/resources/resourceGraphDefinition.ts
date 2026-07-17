import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kroRoutePaths } from '../utils/kroRoutes';

export const kroApiGroup = 'kro.run';
export const kroApiVersion = 'v1alpha1';

/** A dependency edge published by kro's static analysis. */
export interface RGDDependency {
  /** ID of the resource that the owning resource depends on. */
  id: string;
}

/**
 * Per-resource dependency information from RGD status.
 * kro only publishes entries for resources that have at least one
 * dependency; resources without dependencies are omitted entirely.
 */
export interface RGDStatusResource {
  id: string;
  dependencies?: RGDDependency[];
}

export interface RGDCondition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
  lastTransitionTime?: string;
  observedGeneration?: number;
}

/** A resource entry in the RGD spec: either an inline template or a read-only external reference. */
export interface RGDSpecResource {
  id: string;
  template?: {
    apiVersion?: string;
    kind?: string;
    [key: string]: unknown;
  };
  externalRef?: {
    apiVersion?: string;
    kind?: string;
    metadata?: {
      name?: string;
      namespace?: string;
    };
  };
  includeWhen?: string[];
  readyWhen?: string[];
}

export interface KubeResourceGraphDefinition extends KubeObjectInterface {
  spec: {
    schema?: {
      apiVersion?: string;
      kind?: string;
      group?: string;
      spec?: Record<string, unknown>;
      status?: Record<string, unknown>;
    };
    resources?: RGDSpecResource[];
  };
  status?: {
    conditions?: RGDCondition[];
    state?: string;
    topologicalOrder?: string[];
    resources?: RGDStatusResource[];
  };
}

export class ResourceGraphDefinition extends KubeObject<KubeResourceGraphDefinition> {
  static kind = 'ResourceGraphDefinition';
  static apiName = 'resourcegraphdefinitions';
  static apiVersion = `${kroApiGroup}/${kroApiVersion}`;
  static isNamespaced = false;

  static get detailsRoute() {
    return kroRoutePaths.resourceGraphDefinitionDetail;
  }

  get spec(): KubeResourceGraphDefinition['spec'] {
    return this.jsonData.spec ?? {};
  }

  get status(): NonNullable<KubeResourceGraphDefinition['status']> {
    return this.jsonData.status ?? {};
  }

  /** Kind of the CRD this RGD generates, from spec.schema. */
  get generatedKind(): string {
    return this.spec.schema?.kind ?? '-';
  }

  /** Full apiVersion of the generated CRD, e.g. "kro.run/v1alpha1". */
  get generatedApiVersion(): string {
    const version = this.spec.schema?.apiVersion;
    if (!version) {
      return '-';
    }
    const group = this.spec.schema?.group || kroApiGroup;
    return `${group}/${version}`;
  }

  /** RGD lifecycle state, e.g. "Active" or "Inactive". */
  get state(): string {
    return this.status.state ?? '-';
  }
}
