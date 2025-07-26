import { fetchCatalogs } from '../api/catalogs';

const ANNOTATION_URI = 'catalog.ocne.io/uri';
const ANNOTATION_NAME = 'catalog.ocne.io/name';
const ANNOTATION_PROTOCOL = 'catalog.ocne.io/protocol';
const ANNOTATION_DISPLAY_NAME = 'catalog.ocne.io/displayName';

const DEFAULT_CATALOG_NAME = 'app-catalog';
const DEFAULT_CATALOG_NAMESPACE = 'ocne-system';

// Catalog interface, containing information relevant to register a catalog in the sidebar
interface Catalog {
  name: string;
  displayName: string;
  metadataName: string;
  namespace: string;
  protocol: string;
  uri: string;
}

// An interface to define component versions
interface ComponentVersions {
  version: string;
}

// Fetch the list of catalogs installed
export function CatalogLists() {
  return fetchCatalogs().then(function (response) {
    const catalogList: Array<Catalog> = new Array<Catalog>();
    for (let i = 0; i < response.items.length; i++) {
      let serviceUri = '';
      const metadata = response.items[i].metadata;
      if (ANNOTATION_URI in metadata.annotations) {
        serviceUri = metadata.annotations[ANNOTATION_URI];
      }

      // Using the first port
      if (serviceUri === '') {
        const port = response.items[i].spec.ports[0];
        serviceUri = port.name + '://' + metadata.name + '.' + metadata.namespace + ':' + port.port;
      }

      let catalogDisplayName = '';
      if (ANNOTATION_DISPLAY_NAME in metadata.annotations && metadata.annotations[ANNOTATION_DISPLAY_NAME] != '') {
        catalogDisplayName = metadata.annotations[ANNOTATION_DISPLAY_NAME]
      } else {
        catalogDisplayName = metadata.annotations[ANNOTATION_NAME]
      }

      const catalog: Catalog = {
        name: metadata.name + '-' + metadata.namespace,
        // If there are 2 catalogs deployed with same name, the sidebar will be same. If we use the namespace,
        // the sidebar will be too long
        displayName: catalogDisplayName,
        metadataName: metadata.name,
        namespace: metadata.namespace,
        protocol: metadata.annotations[ANNOTATION_PROTOCOL],
        uri: serviceUri,
      };

      // Insert the default catalog as the first element of the array
      if (
        metadata.name === DEFAULT_CATALOG_NAME &&
        metadata.namespace === DEFAULT_CATALOG_NAMESPACE
      ) {
        catalogList.unshift(catalog);
      } else {
        catalogList.push(catalog);
      }
    }
    return catalogList;
  });
}

// Return a map with component as the key and an array of versions as the value
export function AvailableComponentVersions(chartEntries: any[]) {
  const compVersions = new Map<any, any[]>();
  for (const [key, value] of Object.entries(chartEntries)) {
    const versions: Array<ComponentVersions> = new Array<ComponentVersions>();
    for (let i = 0; i < value.length; i++) {
      const v: ComponentVersions = {
        version: value[i].version,
      };
      versions.push(v);
    }
    compVersions.set(key, versions);
  }
  return compVersions;
}
