import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { TINKERBELL_API_VERSION, TinkerbellResource } from './common';

/** Fully qualified CRD name for Tinkerbell Template resources. */
export const TEMPLATE_CRD_NAME = 'templates.tinkerbell.org';

/**
 * Desired template configuration.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/tinkerbell.org_templates.yaml
 */
export interface TemplateSpec {
  /** Template data rendered into workflow tasks and actions. */
  data?: string;
}

/** Observed status for a Tinkerbell Template object. */
export interface TemplateStatus {
  /** Current template state. */
  state?: string;
}

/** Kubernetes object shape for a Tinkerbell Template resource. */
export interface TinkerbellTemplate extends TinkerbellResource {
  /** Desired template configuration. */
  spec?: TemplateSpec;

  /** Observed template status. */
  status?: TemplateStatus;
}

/**
 * Headlamp resource model for Tinkerbell Template.
 *
 * @see https://github.com/tinkerbell/tinkerbell/blob/v0.23.0/crd/bases/tinkerbell.org_templates.yaml
 */
export class Template extends KubeObject<TinkerbellTemplate> {
  static readonly apiName = 'templates';
  static readonly apiVersion = TINKERBELL_API_VERSION;
  static readonly crdName = TEMPLATE_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'Template';

  static get detailsRoute() {
    return '/tinkerbell/templates/:namespace/:name';
  }

  get spec(): TemplateSpec | undefined {
    return this.jsonData.spec;
  }

  get data(): string | undefined {
    return this.spec?.data;
  }

  get status(): TemplateStatus | undefined {
    return this.jsonData.status;
  }
}
