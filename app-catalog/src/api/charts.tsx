import { PAGE_OFFSET_COUNT_FOR_CHARTS } from '../components/charts/List';

export async function fetchChartsFromArtifact(
  search: string = '',
  verified: boolean,
  category: { title: string; value: number },
  page: number,
  limit: number = PAGE_OFFSET_COUNT_FOR_CHARTS
) {
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
  return fetch(`http://localhost:4466/externalproxy`, {
    headers: {
      'Forward-To': `https://artifacthub.io/api/v1/packages/helm/${repoName}/${chartName}`,
    },
  }).then(response => response.json());
}

export function fetchChartValues(packageID: string, packageVersion: string) {
  return fetch(`http://localhost:4466/externalproxy`, {
    headers: {
      'Forward-To': `https://artifacthub.io/api/v1/packages/${packageID}/${packageVersion}/values`,
    },
  }).then(response => response.text());
}
