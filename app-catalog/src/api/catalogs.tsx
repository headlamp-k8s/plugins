import { QueryParameters, request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { ChartsList } from '../components/charts/List';
import { COMMUNITY_REPO, VANILLA_HELM_REPO } from '../constants/catalog';
import { setCatalogConfig } from './catalogConfig';

const SERVICE_ENDPOINT = '/api/v1/services';
const LABEL_CATALOG = 'catalog.headlamp.dev/is-catalog';

/**
 * Resets the global variables used for chart configuration.
 * Reset the prefix and profile, to switch between different catalogs
 * @param metadataName - The metadata name of the catalog.
 * @param namespace - The namespace of the catalog.
 * @param prefix - The prefix for chart URLs.
 * @param profile - The profile for charts.
 * @param valuesPrefix - The prefix for chart values.
 */
export function ResetGlobalVars(
  metadataName: string,
  namespace: string,
  prefix: string,
  profile: string,
  valuesPrefix: string
) {
  setCatalogConfig({
    chartURLPrefix: prefix,
    chartProfile: profile,
    chartValuesPrefix: valuesPrefix,
    catalogNamespace: namespace,
    catalogName: metadataName,
  });
}

/**
 * Resets the global variables and renders the ChartsList component for a Helm chart.
 *
 * @param metadataName - The metadata name of the catalog.
 * @param namespace - The namespace of the catalog.
 * @param chartUrl - The URL of the Helm chart repository.
 *
 * @returns The ChartsList component.
 */
export function HelmChartList(metadataName: string, namespace: string, chartUrl: string) {
  ResetGlobalVars(metadataName, namespace, chartUrl, VANILLA_HELM_REPO, `values`);
  return <ChartsList />;
}

/**
 * Resets the global variables and renders the ChartsList component for a community chart(artifacthub).
 *
 * @param metadataName - The metadata name of the catalog.
 * @param namespace - The namespace of the catalog.
 * @param chartUrl - The URL of the community chart repository.
 *
 * @returns The ChartsList component for the community chart.
 */
export function CommunityChartList(metadataName: string, namespace: string, chartUrl: string) {
  ResetGlobalVars(metadataName, namespace, chartUrl, COMMUNITY_REPO, '');
  return <ChartsList />;
}

/**
 * Fetches the list of catalogs in the cluster.
 * It uses a query parameter to fetch services with the given label.
 *
 * @returns  A promise resolving to the response from the request.
 */
export function fetchCatalogs() {
  // Use query parameter to fetch the services with label catalog.headlamp.dev/is-catalog
  const queryParam: QueryParameters = {
    labelSelector: LABEL_CATALOG + '=',
  };
  return request(SERVICE_ENDPOINT, {}, true, true, queryParam).then(response => response);
}
