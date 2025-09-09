import { QueryParameters, request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { ChartsList } from '../components/charts/List';
import { setCatalogConfig } from "./catalogConfig";
import {
    COMMUNITY_REPO,
    VANILLA_HELM_REPO,
} from '../constants/catalog';

const SERVICE_ENDPOINT = '/api/v1/services';
const LABEL_CATALOG = 'catalog.ocne.io/is-catalog';

// Reset the CHART_URL_PREFIX and CHART_PROFILE, to switch between different catalogs
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
  })
}

// Reset the variables and call ChartsList, when the protocol is helm
export function HelmChartList(metadataName: string, namespace: string, chartUrl: string) {
  ResetGlobalVars(metadataName, namespace, chartUrl, VANILLA_HELM_REPO, `values`);
  return <ChartsList />;
}

// Reset the variables and call ChartsList, when the protocol is artifacthub
export function CommunityChartList(metadataName: string, namespace: string, chartUrl: string) {
  ResetGlobalVars(metadataName, namespace, chartUrl, COMMUNITY_REPO, '');
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
