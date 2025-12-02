import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';

export function createNodeClassClass(config) {
  // Create the NodeClass resource class with the specified configuration
  const NodeClass = makeCustomResourceClass({
    apiInfo: [
      {
        group: config.group,
        version: config.version,
      },
    ],
    isNamespaced: false,
    singularName: config.singularName,
    pluralName: config.pluralName,
    kind: config.kind,
    customResourceDefinition: undefined as any,
  });

  return class extends NodeClass {
    static get detailsRoute() {
      return config.detailsRoute;
    }

    // Ensure correct API version format
    static get apiVersion() {
      return `${config.group}/${config.version}`;
    }

    static get pluralName() {
      return config.pluralName;
    }

    static get kind() {
      return config.kind;
    }
  };
}
