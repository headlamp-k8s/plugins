import { EmptyContent, Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useCluster } from '@kinvolk/headlamp-plugin/lib/k8s';
import { KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { ReactNode, useEffect, useState } from 'react';

interface KueueAdminResourceAccessProps {
  /** Kueue resource class to check access for. */
  resourceClass: KubeObjectClass;
  /** Human-readable resource name shown in loading and denied messages. */
  resourceLabel: string;
  /** Kubernetes verb to verify before rendering the page. */
  verb: 'get' | 'list';
  /** Optional sentence describing the resource scope in denied messages. */
  accessDescription?: string;
  /** Cluster to check access in. Defaults to the cluster in the current route. */
  cluster?: string;
  /** Page content to render after the user is authorized. */
  children: ReactNode;
}

export default function KueueAdminResourceAccess({
  resourceClass,
  resourceLabel,
  verb,
  accessDescription = `Kueue ${resourceLabel} are cluster-scoped admin resources.`,
  cluster,
  children,
}: KueueAdminResourceAccessProps) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  // Resolve the route cluster here so switching clusters on the same route checks access again.
  const routeCluster = useCluster();
  const targetCluster = cluster ?? routeCluster ?? undefined;

  // AuthVisible only takes the cluster from an object, not from a resource class.
  useEffect(() => {
    let current = true;
    setAllowed(null);
    resourceClass
      .getAuthorization(verb, {}, targetCluster)
      .then(result => current && setAllowed(!!result?.status?.allowed))
      .catch(() => current && setAllowed(false));
    return () => {
      current = false;
    };
  }, [resourceClass, verb, targetCluster]);

  return (
    <>
      {allowed === null && <Loader title={`Checking access to Kueue ${resourceLabel}`} />}
      {allowed === false && (
        <SectionBox title={`Kueue ${resourceLabel}`}>
          <EmptyContent color="text.secondary">
            {`${accessDescription} Your current Kubernetes credentials are not authorized to ${
              verb === 'get' ? 'view' : 'list'
            } this page.`}
          </EmptyContent>
        </SectionBox>
      )}
      {allowed && children}
    </>
  );
}
