import {
  AuthVisible,
  EmptyContent,
  Loader,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useCluster } from '@kinvolk/headlamp-plugin/lib/k8s';
import { KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
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
  /** Page content to render after the user is authorized. */
  children: ReactNode;
}

export default function KueueAdminResourceAccess({
  resourceClass,
  resourceLabel,
  verb,
  accessDescription = `Kueue ${resourceLabel} are cluster-scoped admin resources.`,
  children,
}: KueueAdminResourceAccessProps) {
  const cluster = useCluster();
  const [installed, setInstalled] = useState<boolean | null>(null);
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    setInstalled(null);
    setAllowed(null);

    if (cluster) {
      isKueueInstalled(cluster).then(result => {
        if (active) {
          setInstalled(result);
        }
      });
    }

    return () => {
      active = false;
    };
  }, [cluster]);

  return (
    <>
      {installed === null && <Loader title="Checking for Kueue" />}
      {installed === false && (
        <SectionBox title="Kueue is not installed">
          <EmptyContent color="text.secondary">
            Kueue custom resources are not available in the selected Kubernetes cluster.
          </EmptyContent>
        </SectionBox>
      )}
      {installed === true && (
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
          <AuthVisible
            item={resourceClass}
            authVerb={verb}
            onAuthResult={result => setAllowed(result.allowed)}
            onError={() => setAllowed(false)}
          >
            {children}
          </AuthVisible>
        </>
      )}
    </>
  );
}
