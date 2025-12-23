import { CustomResourceDefinition } from './resources/k8s/customResourceDefinition';

const KNATIVE_SERVING_KSERVICE_CRD_NAME = 'services.serving.knative.dev';

function hasCrdInCluster(cluster: string, crdName: string): Promise<boolean> {
  return new Promise(resolve => {
    let cancelFn: (() => void) | null = null;
    let settled = false;

    function settle(result: boolean) {
      if (settled) {
        return;
      }
      settled = true;
      resolve(result);
      if (cancelFn) {
        cancelFn();
      }
    }

    const request = CustomResourceDefinition.apiGet(
      () => settle(true),
      crdName,
      undefined,
      () => settle(false),
      { cluster }
    );

    request()
      .then(cancel => {
        cancelFn = cancel;
      })
      .catch(() => {
        settle(false);
      });
  });
}

export async function isKnativeInstalled(clusters: string[]): Promise<boolean> {
  if (!clusters || clusters.length === 0) {
    return false;
  }

  const results = await Promise.all(
    clusters.map(cluster => hasCrdInCluster(cluster, KNATIVE_SERVING_KSERVICE_CRD_NAME))
  );

  // Consider Knative "installed" only if it exists in all selected clusters.
  return results.every(Boolean);
}
