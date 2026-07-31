import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kroRoutePaths } from '../utils/kroRoutes';
import { kroApiGroup, kroApiVersion } from './kroApi';

export { kroApiGroup, kroApiVersion } from './kroApi';

/**
 * A dependency edge published by kro's static analysis.
 *
 * @see https://kro.run/docs/concepts/rgd/dependencies-ordering
 * @see https://github.com/kubernetes-sigs/kro/blob/main/api/v1alpha1/resourcegraphdefinition_types.go
 */
export interface RGDDependency {
  /** ID of the resource that the owning resource depends on. */
  id: string;
}

/**
 * Per-resource dependency information from RGD status.
 * kro only publishes entries for resources that have at least one
 * dependency; resources without dependencies are omitted entirely
 * (verified against kro 0.9.2).
 *
 * @see https://github.com/kubernetes-sigs/kro/blob/main/api/v1alpha1/resourcegraphdefinition_types.go
 */
export interface RGDStatusResource {
  /** The resource's id from spec.resources[]. */
  id: string;
  /** Resources this one references via CEL expressions. */
  dependencies?: RGDDependency[];
}

/**
 * A status condition on an RGD. kro reports GraphAccepted,
 * GraphRevisionsResolved, KindReady, ControllerReady, and Ready.
 *
 * @see https://kro.run/docs/concepts/rgd/status-conditions
 */
export interface RGDCondition {
  /** Condition type, e.g. "Ready" or "GraphAccepted". */
  type: string;
  /** "True", "False", or "Unknown". */
  status: string;
  /** Machine-readable reason for the last transition. */
  reason?: string;
  /** Human-readable message for the last transition. */
  message?: string;
  /** RFC 3339 timestamp of the last status change. */
  lastTransitionTime?: string;
  /** metadata.generation the condition was computed against. */
  observedGeneration?: number;
}

/**
 * A resource entry in the RGD spec: either an inline template or a
 * read-only external reference.
 *
 * @see https://kro.run/docs/concepts/rgd/overview
 * @see https://github.com/kubernetes-sigs/kro/blob/main/api/v1alpha1/resourcegraphdefinition_types.go
 */
export interface RGDSpecResource {
  /** Unique id of this resource inside the graph. */
  id: string;
  /** Inline manifest template, possibly containing CEL expressions. */
  template?: {
    apiVersion?: string;
    kind?: string;
    [key: string]: unknown;
  };
  /** Reference to an existing object kro reads but never creates or owns. */
  externalRef?: {
    apiVersion?: string;
    kind?: string;
    metadata?: {
      name?: string;
      namespace?: string;
    };
  };
  /** CEL expressions gating whether the resource is created at all. */
  includeWhen?: string[];
  /** CEL expressions defining when the resource counts as ready. */
  readyWhen?: string[];
}

/**
 * Raw shape of a kro.run/v1alpha1 ResourceGraphDefinition object.
 *
 * @see https://kro.run/docs/concepts/rgd/overview
 * @see https://github.com/kubernetes-sigs/kro/blob/main/api/v1alpha1/resourcegraphdefinition_types.go
 */
export interface KubeResourceGraphDefinition extends KubeObjectInterface {
  spec: {
    /**
     * The SimpleSchema defining the generated API: its kind, version,
     * optional group, spec fields, and CEL-derived status fields.
     *
     * @see https://kro.run/docs/concepts/rgd/schema
     */
    schema?: {
      /** Version of the generated API, e.g. "v1alpha1". */
      apiVersion?: string;
      /** Kind of the generated API, e.g. "WebApp". */
      kind?: string;
      /** API group of the generated CRD; defaults to "kro.run". */
      group?: string;
      /** SimpleSchema spec fields, e.g. `replicas: "integer | default=1"`. */
      spec?: Record<string, unknown>;
      /** Status fields projected from resources via CEL expressions. */
      status?: Record<string, unknown>;
    };
    /** The resource graph this RGD expands instances into. */
    resources?: RGDSpecResource[];
  };
  status?: {
    /** Latest observed conditions. */
    conditions?: RGDCondition[];
    /** Lifecycle state: "Active" or "Inactive". */
    state?: string;
    /** All resource ids in dependency order (a full node list). */
    topologicalOrder?: string[];
    /** Dependency edges; entries without dependencies are omitted. */
    resources?: RGDStatusResource[];
  };
}

/**
 * Headlamp resource class for kro's cluster-scoped
 * ResourceGraphDefinition (kro.run/v1alpha1).
 *
 * @see https://kro.run/docs/concepts/rgd/overview
 */
export class ResourceGraphDefinition extends KubeObject<KubeResourceGraphDefinition> {
  static kind = 'ResourceGraphDefinition';
  static apiName = 'resourcegraphdefinitions';
  static apiVersion = `${kroApiGroup}/${kroApiVersion}`;
  static isNamespaced = false;

  /** Route of the plugin's RGD detail page. */
  static get detailsRoute() {
    return kroRoutePaths.resourceGraphDefinitionDetail;
  }

  /** The RGD spec; empty object when missing. */
  get spec(): KubeResourceGraphDefinition['spec'] {
    return this.jsonData.spec ?? {};
  }

  /** The RGD status; empty object when the RGD has none yet. */
  get status(): NonNullable<KubeResourceGraphDefinition['status']> {
    return this.jsonData.status ?? {};
  }

  /** Kind of the CRD this RGD generates, from spec.schema; "-" when unset. */
  get generatedKind(): string {
    return this.spec.schema?.kind ?? '-';
  }

  /** Full apiVersion of the generated CRD, e.g. "kro.run/v1alpha1"; "-" when unset. */
  get generatedApiVersion(): string {
    const version = this.spec.schema?.apiVersion;
    if (!version) {
      return '-';
    }
    const group = this.spec.schema?.group || kroApiGroup;
    return `${group}/${version}`;
  }

  /** RGD lifecycle state, e.g. "Active" or "Inactive"; "-" when unset. */
  get state(): string {
    return this.status.state ?? '-';
  }
}
