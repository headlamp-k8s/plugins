import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { TINKERBELL_API_VERSION, TinkerbellResource } from './common';

export const TEMPLATE_CRD_NAME = 'templates.tinkerbell.org';

export interface TemplateSpec {
  data?: string;
}

export interface TinkerbellTemplate extends TinkerbellResource {
  spec?: TemplateSpec;
}

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
}
