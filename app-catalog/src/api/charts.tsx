import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
    COMMUNITY_REPO,
    CUSTOM_CHART_VALUES_PREFIX,
    PAGE_OFFSET_COUNT_FOR_CHARTS,
    VANILLA_HELM_REPO,
} from '../constants/catalog';
import { yamlToJSON } from '../helpers';
import { isElectron } from '../index';
import { getCatalogConfig, setChartValuesPrefix } from "./catalogConfig";

// Headlamp plugin's backend service proxy endpoint.
// It was implemented by Headlamp's backed to proxies in-cluster requests to handle authentication
const SERVICE_PROXY = '/serviceproxy';

const getURLSearchParams = url => {
  return new URLSearchParams({ request: url }).toString();
};

export async function fetchChartsFromArtifact(
  search: string = '',
  verified: boolean,
  category: { title: string; value: number },
  page: number,
  limit: number = PAGE_OFFSET_COUNT_FOR_CHARTS
) {
  if (!isElectron()) {
    const chartCfg = getCatalogConfig()
    if (chartCfg.chartProfile === VANILLA_HELM_REPO) {
      // When chartProfile is VANILLA_HELM_REPOSITORY, the code expects /charts/index.yaml
      // to contain the metadata of the available charts
      const url =
        `${SERVICE_PROXY}/${chartCfg.catalogNamespace}/${chartCfg.catalogName}?` +
        getURLSearchParams(`charts/index.yaml`);

      // Ensure that the UI renders index.yaml in yaml and json format. Please note that, helm repo index generates index.yaml
      // in yaml as the default format, although latest versions support generating the file in json format.
      // The API yamlToJSON works for the response in yaml as well as json format.
      //const dataResponse = request(url, { isJSON: false }, true, true, {})
      //  .then(response => response.text())
      //  .then(yamlResponse => yamlToJSON(yamlResponse));
      const dataResponse = await request(url, { isJSON: false }, true, true, {});
      const yamlResponse = await dataResponse.text();
	  const jsonResponse = yamlToJSON(yamlResponse);
      const total = Object.keys(jsonResponse.entries || {}).length;
      return { dataResponse, total };
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
        `${SERVICE_PROXY}/${chartCfg.catalogNamespace}/${chartCfg.catalogName}?` + getURLSearchParams(requestParam);
      const response = request(url, {}, true, true, {}).then(response => response);
      const dataResponse = response
      const total = response.headers.get('pagination-total-count');
      return { dataResponse, total };
      //return request(url, {}, true, true, {}).then(response => response);
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
  const total = response.headers.get('pagination-total-count');

  const dataResponse = await response.json();

  return { dataResponse, total };
}

export function fetchChartDetailFromArtifact(chartName: string, repoName: string) {
  const chartCfg = getCatalogConfig()
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

export function fetchChartValues(packageID: string, packageVersion: string) {
  const chartCfg = getCatalogConfig()
  if (!isElectron()) {
    let requestParam = '';
    if (chartCfg.chartProfile === VANILLA_HELM_REPO) {
      // When the token CUSTOM_CHART_VALUES_PREFIX is replaced during the deployment, expect the values.yaml for the specified
      // package and version accessible on ${CUSTOM_CHART_VALUES_PREFIX}/${packageID}/${packageVersion}/values.yaml
      if (CUSTOM_CHART_VALUES_PREFIX !== 'CUSTOM_CHART_VALUES_PREFIX') {
        chartCfg.setChartValuesPrefix(`${CUSTOM_CHART_VALUES_PREFIX}`);
      }
      // The code expects /${packageID}/${packageVersion}/values.yaml to return values.yaml for the component
      // denoted by packageID and a given packageVersion. Please note that, chart.name is used for packageID in this case.
      requestParam = `${chartCfg.chartValuesPrefix}/${packageID}/${packageVersion}/values.yaml`;
    } else if (chartCfg.chartProfile === COMMUNITY_REPO) {
      requestParam = `api/v1/packages/${packageID}/${packageVersion}/values`;
    }
    const url =
      `${SERVICE_PROXY}/${chartCfg.catalogNamespace}/${chartCfg.catalogName}?` + getURLSearchParams(requestParam);

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

export async function  fetchChartIcon(iconName: string) {
  const chartCfg = getCatalogConfig();
  const url =
      `${SERVICE_PROXY}/${chartCfg.catalogNamespace}/${chartCfg.catalogName}?` +
      getURLSearchParams(`${iconName}`);
  return request(url, {isJSON: false}, true, true, {}).then(response => response);
}

