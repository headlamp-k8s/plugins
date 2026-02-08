import { ApiProxy, getHeadlampAPIHeaders } from '@kinvolk/headlamp-plugin/lib';

const request = ApiProxy.request;

/**
 * Helper to ensure API errors are surfaced clearly
 */
async function safeRequest(url: string, options: any) {
  try {
    const response = await request(url, options);

    if (!response) {
      throw new Error('Empty response from Helm API');
    }

    if (response.error) {
      throw new Error(response.error);
    }

    return response;
  } catch (error: any) {
    throw new Error(error?.message || 'Helm API request failed');
  }
}

export function listReleases() {
  return safeRequest('/helm/releases/list', {
    method: 'GET',
    headers: { ...getHeadlampAPIHeaders() },
  });
}

export function getRelease(namespace: string, releaseName: string) {
  return safeRequest(`/helm/releases?name=${releaseName}&namespace=${namespace}`, {
    method: 'GET',
    headers: { ...getHeadlampAPIHeaders() },
  });
}

export function getReleaseHistory(namespace: string, releaseName: string) {
  return safeRequest(`/helm/release/history?name=${releaseName}&namespace=${namespace}`, {
    method: 'GET',
    headers: { ...getHeadlampAPIHeaders() },
  });
}

export function deleteRelease(namespace: string, releaseName: string) {
  return safeRequest(`/helm/releases/uninstall?name=${releaseName}&namespace=${namespace}`, {
    method: 'DELETE',
    headers: { ...getHeadlampAPIHeaders() },
  });
}

export function rollbackRelease(namespace: string, releaseName: string, version: string) {
  return safeRequest(`/helm/releases/rollback?name=${releaseName}&namespace=${namespace}`, {
    method: 'PUT',
    headers: { ...getHeadlampAPIHeaders() },
    body: JSON.stringify({
      name: releaseName,
      namespace: namespace,
      revision: version,
    }),
  });
}

export function createRelease(
  name: string,
  namespace: string,
  values: string,
  chart: string,
  version: string,
  description: string
) {
  return safeRequest(`/helm/release/install?namespace=${namespace}`, {
    method: 'POST',
    headers: { ...getHeadlampAPIHeaders() },
    body: JSON.stringify({
      name,
      namespace,
      values,
      chart,
      version,
      description,
    }),
  });
}

export function getActionStatus(name: string, action: string) {
  return safeRequest(`/helm/action/status?name=${name}&action=${action}`, {
    method: 'GET',
    headers: { ...getHeadlampAPIHeaders() },
  });
}

export function upgradeRelease(
  name: string,
  namespace: string,
  values: string,
  chart: string,
  description: string,
  version: string
) {
  return safeRequest(`/helm/releases/upgrade?name=${name}&namespace=${namespace}`, {
    method: 'PUT',
    headers: { ...getHeadlampAPIHeaders() },
    body: JSON.stringify({
      name,
      namespace,
      values,
      chart,
      description,
      version,
    }),
  });
}

export function fetchChart(name: string) {
  return safeRequest(`/helm/charts?filter=${name}`, {
    method: 'GET',
    headers: { ...getHeadlampAPIHeaders() },
  });
}
