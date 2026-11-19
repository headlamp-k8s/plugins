import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { EmptyContent, Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { Link } from '@mui/material';
import { ReactNode, useEffect, useState } from 'react';
import { isKueueInstalled } from '../../utils/kueueInstallation';

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

/** A check result, kept with the cluster it was made for. */
interface ClusterResult {
  cluster: string | undefined;
  value: boolean;
}

export default function KueueAdminResourceAccess({
  resourceClass,
  resourceLabel,
  verb,
  accessDescription = `Kueue ${resourceLabel} are cluster-scoped admin resources.`,
  cluster,
  children,
}: KueueAdminResourceAccessProps) {
  const [installedResult, setInstalledResult] = useState<ClusterResult | null>(null);
  const [allowedResult, setAllowedResult] = useState<ClusterResult | null>(null);
  // Resolve the route cluster here so switching clusters on the same route checks again.
  const routeCluster = K8s.useCluster();
  const targetCluster = cluster ?? routeCluster ?? undefined;

  // Effects reset state only after a render, so a result for another cluster would
  // otherwise show the page for one render before the new cluster is checked.
  const installed =
    installedResult && installedResult.cluster === targetCluster ? installedResult.value : null;
  const allowed =
    allowedResult && allowedResult.cluster === targetCluster ? allowedResult.value : null;

  useEffect(() => {
    let current = true;
    isKueueInstalled(targetCluster).then(
      value => current && setInstalledResult({ cluster: targetCluster, value })
    );
    return () => {
      current = false;
    };
  }, [targetCluster]);

  // AuthVisible only takes the cluster from an object, not from a resource class.
  useEffect(() => {
    let current = true;
    const done = (value: boolean) => current && setAllowedResult({ cluster: targetCluster, value });
    resourceClass
      .getAuthorization(verb, {}, targetCluster)
      .then(result => done(!!result?.status?.allowed))
      .catch(() => done(false));
    return () => {
      current = false;
    };
  }, [resourceClass, verb, targetCluster]);

  if (installed === false) {
    return (
      <SectionBox title="Kueue is not installed">
        <EmptyContent color="text.secondary">
          {/* One child, so EmptyContent keeps the sentence and its link on one line. */}
          <span>
            Kueue custom resources are not available in the selected Kubernetes cluster.{' '}
            <Link
              href="https://kueue.sigs.k8s.io/docs/getting-started/installation/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Install Kueue
            </Link>
          </span>
        </EmptyContent>
      </SectionBox>
    );
  }

  if (installed === null || allowed === null) {
    return <Loader title={`Checking access to Kueue ${resourceLabel}`} />;
  }

  if (!allowed) {
    return (
      <SectionBox title={`Kueue ${resourceLabel}`}>
        <EmptyContent color="text.secondary">
          {`${accessDescription} Your current Kubernetes credentials are not authorized to ${
            verb === 'get' ? 'view' : 'list'
          } this page.`}
        </EmptyContent>
      </SectionBox>
    );
  }

  return <>{children}</>;
}
