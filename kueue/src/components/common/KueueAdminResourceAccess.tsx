import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { EmptyContent, Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { Link } from '@mui/material';
import { ReactNode, useEffect, useState } from 'react';
import { resolveAuthNamespace } from '../../utils/authNamespace';
import { isKueueInstalled } from '../../utils/kueueInstallation';

interface KueueAdminResourceAccessProps {
  /** Kueue resource class to check access for. */
  resourceClass: KubeObjectClass;
  /** Human-readable resource name shown in loading and denied messages. */
  resourceLabel: string;
  /** Kubernetes verb to verify before rendering the page. */
  verb: 'get' | 'list';
  /** Namespace to scope the check to. Ignored for cluster-scoped resources. */
  namespace?: string;
  /** Optional sentence describing the resource scope in denied messages. */
  accessDescription?: string;
  /** Cluster to check access in. Defaults to the cluster in the current route. */
  cluster?: string;
  /** Skip the installation check, for a page that already sits in a KueueInstallationGate. */
  installationChecked?: boolean;
  /** Page content to render after the user is authorized. */
  children: ReactNode;
}

/** Resolve the cluster to check: the given one, else the one in the current route. */
function useTargetCluster(cluster?: string) {
  const routeCluster = K8s.useCluster();
  return cluster ?? routeCluster ?? undefined;
}

/**
 * Run a check once per mount. Callers key the component by cluster, so a cluster
 * switch remounts it and shows the loader until the new cluster answers, instead
 * of reusing an earlier result for that cluster or another one.
 */
function useCheck(check: () => Promise<boolean>) {
  const [result, setResult] = useState<boolean | null>(null);
  useEffect(() => {
    let current = true;
    check().then(
      value => current && setResult(value),
      () => current && setResult(false)
    );
    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return result;
}

function InstallationCheck({ cluster, children }: { cluster?: string; children: ReactNode }) {
  const installed = useCheck(() => isKueueInstalled(cluster));

  if (installed === null) {
    return <Loader title="Checking for Kueue" />;
  }

  if (!installed) {
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

  return <>{children}</>;
}

/** Render the children only when the cluster serves the Kueue API. */
export function KueueInstallationGate(props: { cluster?: string; children: ReactNode }) {
  const cluster = useTargetCluster(props.cluster);
  return (
    <InstallationCheck key={cluster ?? ''} cluster={cluster}>
      {props.children}
    </InstallationCheck>
  );
}

function AccessCheck({
  resourceClass,
  resourceLabel,
  verb,
  namespace,
  accessDescription = `Kueue ${resourceLabel} are cluster-scoped admin resources.`,
  cluster,
  children,
}: KueueAdminResourceAccessProps) {
  const authNamespace = resolveAuthNamespace(resourceClass, namespace);

  // AuthVisible only takes the cluster from an object, not from a resource class.
  const allowed = useCheck(() =>
    resourceClass
      .getAuthorization(verb, authNamespace ? { namespace: authNamespace } : {}, cluster)
      .then((result: any) => !!result?.status?.allowed)
  );

  if (allowed === null) {
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

export default function KueueAdminResourceAccess(props: KueueAdminResourceAccessProps) {
  const cluster = useTargetCluster(props.cluster);
  // Key by namespace too, so opening a resource in another namespace checks access again.
  const access = (
    <AccessCheck key={`${cluster ?? ''}/${props.namespace ?? ''}`} {...props} cluster={cluster} />
  );
  return props.installationChecked ? (
    access
  ) : (
    <KueueInstallationGate cluster={cluster}>{access}</KueueInstallationGate>
  );
}
