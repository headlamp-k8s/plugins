import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  COMMUNITY_REPO,
  CUSTOM_CHART_VALUES_PREFIX,
  PAGE_OFFSET_COUNT_FOR_CHARTS,
  VANILLA_HELM_REPO,
} from '../constants/catalog';
import { yamlToJSON } from '../helpers';
import { isElectron } from '../index';
import { getCatalogConfig, setChartValuesPrefix } from './catalogConfig';

// Headlamp plugin's backend service proxy endpoint.
// It was implemented by Headlamp's backed to proxies in-cluster requests to handle authentication
const SERVICE_PROXY = '/serviceproxy';

/**
 * Encodes a URL as a query parameter for another URL.
 *
 * @param url - The URL to be encoded as a query parameter.
 * @returns The encoded URL as a query parameter.
 */
const getURLSearchParams = url => {
  return new URLSearchParams({ request: url }).toString();
};

/**
 * Fetches charts from the Artifact repository based on the provided search criteria.
 *
 * @param  search - The search query to filter charts.
 * @param  verified - Whether to fetch charts from verified publishers.
 * @param category - The category to filter charts by.
 * @param  page - The page number to fetch.
 * @param [limit=PAGE_OFFSET_COUNT_FOR_CHARTS] - The number of charts to fetch per page.
 * @returns An object containing the fetched charts and the total count.
 */
export async function fetchChartsFromArtifact(
  search: string = '',
  verified: boolean,
  category: { title: string; value: number },
  page: number,
  limit: number = PAGE_OFFSET_COUNT_FOR_CHARTS
) {
  if (!isElectron()) {
    const chartCfg = getCatalogConfig();
    if (chartCfg.chartProfile === VANILLA_HELM_REPO) {
      // When chartProfile is VANILLA_HELM_REPOSITORY, the code expects /charts/index.yaml
      // to contain the metadata of the available charts
      const url =
        `${SERVICE_PROXY}/${chartCfg.catalogNamespace}/${chartCfg.catalogName}?` +
        getURLSearchParams(`charts/index.yaml`);

      // Ensure that the UI renders index.yaml in yaml and json format. Please note that, helm repo index generates index.yaml
      // in yaml as the default format, although latest versions support generating the file in json format.
      // The API yamlToJSON works for the response in yaml as well as json format.
      const dataResponse = await request(url, { isJSON: false }, true, true, {});
      const yamlResponse = (await dataResponse?.text()) ?? '';
      const jsonResponse = yamlToJSON(yamlResponse) as Record<string, unknown>;
      const total = Object.keys(jsonResponse.entries ?? {}).length;
      return { data: jsonResponse, total };
    } else if (chartCfg.chartProfile === COMMUNITY_REPO) {
      let requestParam = '';
      if (!category || category.value === 0) {
        requestParam = `api/v1/packages/search?kind=0&ts_query_web=${search}&sort=relevance&facets=true&limit=${limit}&offset=${
          (page - 1) * limit
        }`;
      } else {
        requestParam = `api/v1/packages/search?kind=0&ts_query_web=${search}&category=${
          category.value
        }&sort=relevance&facets=true&limit=${limit}&offset=${(page - 1) * limit}`;
      }

      const url =
        `${SERVICE_PROXY}/${chartCfg.catalogNamespace}/${chartCfg.catalogName}?` +
        getURLSearchParams(requestParam);
      const dataResponse = await request(url, {}, true, true, {}).then(response => response);
      const total = dataResponse?.headers?.get('pagination-total-count') ?? 0;
      return { data: dataResponse, total };
    }
  }

  // App-catalog desktop version
  // note: we are currently defaulting to search by verified and official as default
  const url = new URL('https://artifacthub.io/api/v1/packages/search');
  url.searchParams.set('offset', ((page - 1) * limit).toString());
  url.searchParams.set('limit', limit.toString());
  url.searchParams.set('facets', 'true');
  url.searchParams.set('kind', '0');
  url.searchParams.set('ts_query_web', search);
  if (category.value) {
    url.searchParams.set('category', category.value.toString());
  }
  url.searchParams.set('sort', 'relevance');
  url.searchParams.set('deprecated', 'false');
  url.searchParams.set('verified_publisher', verified.toString());

  const response = await fetch(url.toString());
  const total = response.headers?.get('pagination-total-count') ?? 0;
  const jsonResponse = await response.json();
  return { data: jsonResponse, total };
}

/**
 * Fetches the details of a chart from the Artifact repository.
 *
 * @param chartName - The name of the chart to fetch details for.
 * @param repoName - The name of the repository where the chart is located.
 * @returns A promise that resolves to the chart details.
 */
export function fetchChartDetailFromArtifact(chartName: string, repoName: string) {
  const chartCfg = getCatalogConfig();
  // Use /serviceproxy to fetch the resource, by specifying the access token
  if (!isElectron() && chartCfg.chartProfile === COMMUNITY_REPO) {
    const url =
      `${SERVICE_PROXY}/${chartCfg.catalogNamespace}/${chartCfg.catalogName}?` +
      getURLSearchParams(`api/v1/packages/helm/${repoName}/${chartName}`);
    return request(url, {}, true, true, {}).then(response => response);
  }

  // Use /externalproxy for App-catalog desktop version

  return fetch(`http://localhost:4466/externalproxy`, {
    headers: {
      'Forward-To': `https://artifacthub.io/api/v1/packages/helm/${repoName}/${chartName}`,
    },
  }).then(response => response.json());
}

/**
 * Fetches the chart values for a specific package and version.
 *
 * @param packageID - The ID of the package to fetch chart values for.
 * @param packageVersion - The version of the package to fetch chart values for.
 * @returns A promise that resolves to the chart values as a string.
 */
export function fetchChartValues(packageID: string, packageVersion: string) {
  const chartCfg = getCatalogConfig();
  if (!isElectron()) {
    let requestParam = '';
    if (chartCfg.chartProfile === VANILLA_HELM_REPO) {
      // When the token CUSTOM_CHART_VALUES_PREFIX is replaced during the deployment, expect the values.yaml for the specified
      // package and version accessible on ${CUSTOM_CHART_VALUES_PREFIX}/${packageID}/${packageVersion}/values.yaml
      if (CUSTOM_CHART_VALUES_PREFIX !== 'CUSTOM_CHART_VALUES_PREFIX') {
        setChartValuesPrefix(`${CUSTOM_CHART_VALUES_PREFIX}`);
      }
      // The code expects /${packageID}/${packageVersion}/values.yaml to return values.yaml for the component
      // denoted by packageID and a given packageVersion. Please note that, chart.name is used for packageID in this case.
      requestParam = `${chartCfg.chartValuesPrefix}/${packageID}/${packageVersion}/values.yaml`;
    } else if (chartCfg.chartProfile === COMMUNITY_REPO) {
      requestParam = `api/v1/packages/${packageID}/${packageVersion}/values`;
    }
    const url =
      `${SERVICE_PROXY}/${chartCfg.catalogNamespace}/${chartCfg.catalogName}?` +
      getURLSearchParams(requestParam);

    // Use /serviceproxy to fetch the resource, by specifying the access token
    return request(url, { isJSON: false }, true, true, {}).then(response => response.text());
  }

  // Use /externalproxy for App-catalog desktop version
  return fetch(`http://localhost:4466/externalproxy`, {
    headers: {
      'Forward-To': `https://artifacthub.io/api/v1/packages/${packageID}/${packageVersion}/values`,
    },
  }).then(response => response.text());
}

/**
 * Fetches the chart icon from the Artifact repository based on the provided icon name.
 *
 * @param iconName - The name of the icon to fetch.
 * @returns A promise that resolves to the chart icon response.
 */
export async function fetchChartIcon(iconName: string) {
  const chartCfg = getCatalogConfig();
  const url =
    `${SERVICE_PROXY}/${chartCfg.catalogNamespace}/${chartCfg.catalogName}?` +
    getURLSearchParams(`${iconName}`);
  return request(url, { isJSON: false }, true, true, {}).then(response => response);
}

/**
 * Fetches the latest application version for a given chart name from Artifact Hub.
 * @param chartName - The name of the chart to fetch the latest version for.
 * @returns A promise that resolves to the latest application version as a string.
 */
export async function fetchLatestAppVersion(chartName: string): Promise<string> {
  if (!chartName) {
    return '—';
  }

  try {
    const url = new URL('https://artifacthub.io/api/v1/packages/search');
    url.searchParams.set('offset', '0');
    url.searchParams.set('limit', '5');
    url.searchParams.set('facets', 'false');
    url.searchParams.set('kind', '0');
    url.searchParams.set('ts_query_web', chartName);

    const response = await fetch(url.toString());
    const dataResponse = await response.json();
    const packages: any[] = dataResponse?.packages ?? [];

    const lowerChartName = chartName.toLowerCase();
    const selectedPackage = packages.find(
      p => p?.name?.toLowerCase() === lowerChartName || p?.normalized_name === lowerChartName
    );

    return selectedPackage?.app_version ?? '—';
  } catch {
    return '—';
  }
}
