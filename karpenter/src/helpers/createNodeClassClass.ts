import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';

export function createNodeClassClass(config) {
  const NodeClass = makeCustomResourceClass({
    apiInfo: [{ group: config.group, version: config.version }],
    isNamespaced: false,
    singularName: config.singularName,
    pluralName: config.pluralName,
  });

  return class extends NodeClass {
    static get detailsRoute() {
      return config.detailsRoute;
    }
  };
}