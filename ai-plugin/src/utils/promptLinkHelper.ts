import { ResourceClasses } from '@kinvolk/headlamp-plugin/lib/k8s';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';

const HEADLAMP_LINK_HOST = 'headlamp';
const HEADLAMP_RESOURCE_DETAILS_LINK = 'resource-details';
const HEADLAMP_CLUSTER_LINK = 'cluster';

export const promptLinksInstructions = `RESOURCE LINKING:
- When you mention a Kubernetes resource (such as a Pod, Deployment, Service, etc.) in your response, ALWAYS format the resource name as a markdown link using this pattern:
  \[RESOURCE_NAME\]\(https://${HEADLAMP_LINK_HOST}/${HEADLAMP_RESOURCE_DETAILS_LINK}?cluster=CLUSTER&kind=KIND&resource=RESOURCE_NAME&ns=NAMESPACE\)
 - Always use the resource name as the markdown link text, not the cluster, namespace, or kind.
- Replace RESOURCE_NAME, CLUSTER, KIND, and NAMESPACE (only for namespaced resources) with the actual values for the resource.
- NEVER surround links with backquotes (\`)!
- When you mention an existing cluster, ALWAYS format the cluster name as a markdown link using this pattern:
  \[CLUSTER_NAME\]\(https://${HEADLAMP_LINK_HOST}/${HEADLAMP_CLUSTER_LINK}?cluster=CLUSTER\)
`;

export function getHeadlampLink(link: string) {
  const linkResult: {
    isHeadlampLink: boolean;
    url: string;
    kubeObject: KubeObject | null;
  } = {
    isHeadlampLink: false,
    url: '',
    kubeObject: null,
  };
  const url = link ? new URL(link, window.location.origin) : null;
  // Check if it's a resource details link
  if (url.host === HEADLAMP_LINK_HOST) {
    linkResult.isHeadlampLink = true;
    // Check if the path is for resource details
    const urlPath = url.pathname.startsWith('/') ? url.pathname.substring(1) : url.pathname;
    if (urlPath === HEADLAMP_RESOURCE_DETAILS_LINK) {
      const searchParams = new URLSearchParams(url.search);
      const cluster = searchParams.get('cluster');
      const kind = searchParams.get('kind');
      const resource = searchParams.get('resource');
      const namespace = searchParams.get('ns');

      // @todo: Add support for CRDs
      let resourceClass = ResourceClasses[kind];
      // If we couldn't match it like this, iterate and try to match it from the API name
      if (!resourceClass) {
        for (const className in ResourceClasses) {
          const rc = ResourceClasses[className];
          if (rc.apiName === kind) {
            resourceClass = rc;
            break;
          }
        }
      }

      if (
        resourceClass &&
        resource &&
        cluster &&
        (resourceClass.isNamespaced ? !!namespace : true)
      ) {
        // Create an instance
        const instance = new resourceClass(
          {
            kind,
            metadata: {
              name: resource,
              ...(resourceClass.isNamespaced ? { namespace } : {}),
            },
          },
          cluster
        );

        linkResult.kubeObject = instance;
        linkResult.url = instance.getDetailsLink();
      }
    } else if (urlPath === HEADLAMP_CLUSTER_LINK) {
      // It's a cluster link
      const searchParams = new URLSearchParams(url.search);
      const cluster = searchParams.get('cluster');
      if (!!cluster) {
        linkResult.url = `/c/${cluster}`;
      }
    }
  }

  // If not a valid Headlamp link, return null
  return linkResult;
}
