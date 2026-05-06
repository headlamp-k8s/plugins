import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { KubeflowResourceCondition } from './common';

/**
 * Desired state declared on a Katib Suggestion resource.
 */
export interface KatibSuggestionSpec {
  requests?: number;
  algorithm?: {
    algorithmName?: string;
  };
  [key: string]: unknown;
}

/**
 * Observed status fields exposed by a Katib Suggestion resource.
 */
export interface KatibSuggestionStatus {
  conditions?: KubeflowResourceCondition[];
  suggestionCount?: number;
  [key: string]: unknown;
}

/**
 * Raw Katib Suggestion custom resource shape consumed by the UI.
 */
export interface KatibSuggestion extends KubeObjectInterface {
  spec?: KatibSuggestionSpec;
  status?: KatibSuggestionStatus;
}

/**
 * Headlamp resource class for the Katib Suggestion CRD (kubeflow.org/v1beta1).
 */
export class KatibSuggestionClass extends KubeObject<KatibSuggestion> {
  static apiVersion = 'kubeflow.org/v1beta1';
  static kind = 'Suggestion';
  static apiName = 'suggestions';
  static isNamespaced = true;

  static get detailsRoute() {
    return '/kubeflow/katib/suggestions/:namespace/:name';
  }

  get spec(): KatibSuggestionSpec {
    return this.jsonData.spec ?? {};
  }

  get status(): KatibSuggestionStatus {
    return this.jsonData.status ?? {};
  }

  get conditions(): KubeflowResourceCondition[] {
    return this.status.conditions ?? [];
  }

  get latestCondition(): KubeflowResourceCondition | null {
    return this.conditions[this.conditions.length - 1] ?? null;
  }
}
