import { QueryParameters, request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { ChartsList, COMMUNITY_REPO, VANILLA_HELM_REPO } from '../components/charts/List';

const SERVICE_ENDPOINT = '/api/v1/services';
const LABEL_CATALOG = 'catalog.ocne.io/is-catalog';

declare global {
  var CHART_URL_PREFIX: string;
  var CHART_PROFILE: string;
  var CHART_VALUES_PREFIX: string;
  var CATALOG_NAMESPACE: string;
  var CATALOG_NAME: string;
}

// Reset the CHART_URL_PREFIX and CHART_PROFILE, to switch between different catalogs
export function ResetGlobalVars(
  metadataName: string,
  namespace: string,
  prefix: string,
  profile: string
) {
  globalThis.CATALOG_NAME = metadataName;
  globalThis.CATALOG_NAMESPACE = namespace;
  globalThis.CHART_URL_PREFIX = prefix;
  globalThis.CHART_PROFILE = profile;
}

// Constants for the supported protocols
export const HELM_PROTOCOL = 'helm';
export const ARTIFACTHUB_PROTOCOL = 'artifacthub';

// Reset the variables and call ChartsList, when the protocol is helm
export function HelmChartList(metadataName: string, namespace: string, chartUrl: string) {
  ResetGlobalVars(metadataName, namespace, chartUrl, VANILLA_HELM_REPO);
  // Let the default value for CHART_VALUES_PREFIX be "values"
  globalThis.CHART_VALUES_PREFIX = `values`;
  return <ChartsList />;
}

// Reset the variables and call ChartsList, when the protocol is artifacthub
export function CommunityChartList(metadataName: string, namespace: string, chartUrl: string) {
  ResetGlobalVars(metadataName, namespace, chartUrl, COMMUNITY_REPO);
  return <ChartsList />;
}

// Fetch the list of services in the cluster
export function fetchCatalogs() {
  // Use query parameter to fetch the services with label catalog.ocne.io/is-catalog
  const queryParam: QueryParameters = {
    labelSelector: LABEL_CATALOG + '=',
  };
  return request(SERVICE_ENDPOINT, {}, true, true, queryParam).then(response => response);
}
