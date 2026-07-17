import { EmptyContent, Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { Link } from '@mui/material';
import { ReactNode } from 'react';

const KRO_INSTALL_DOCS = 'https://kro.run/docs/getting-started/Installation/';

/**
 * Detects whether kro is installed by fetching its RGD CRD. Only a 404
 * counts as "not installed": on RBAC errors the check stays neutral so
 * pages can attempt to render and degrade on their own.
 */
export function useKroInstalled() {
  const [crd, error] = CustomResourceDefinition.useGet('resourcegraphdefinitions.kro.run');
  return {
    isInstalled: !!crd,
    notInstalled: error?.status === 404,
    isLoading: !crd && !error,
  };
}

/**
 * Renders children only when kro's CRDs exist; shows a friendly install
 * pointer otherwise. Never blocks on RBAC errors.
 */
export default function KroInstallGuard(props: { children: ReactNode }) {
  const { notInstalled, isLoading } = useKroInstalled();

  if (isLoading) {
    return <Loader title="Checking for kro" />;
  }
  if (notInstalled) {
    return (
      <SectionBox title="kro is not installed">
        <EmptyContent>
          <>
            This cluster has no ResourceGraphDefinition API (resourcegraphdefinitions.kro.run).
            Install kro to define resource graphs — see the{' '}
            <Link href={KRO_INSTALL_DOCS} target="_blank" rel="noreferrer">
              kro installation guide
            </Link>
            .
          </>
        </EmptyContent>
      </SectionBox>
    );
  }
  return <>{props.children}</>;
}
