import {
  AuthVisible,
  EmptyContent,
  Loader,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { ReactNode, useState } from 'react';

interface KueueAdminResourceAccessProps {
  /** Kueue admin resource class to check access for. */
  resourceClass: KubeObjectClass;
  /** Human-readable resource name shown in loading and denied messages. */
  resourceLabel: string;
  /** Kubernetes verb to verify before rendering the page. */
  verb: 'get' | 'list';
  /** Page content to render after the user is authorized. */
  children: ReactNode;
}

export default function KueueAdminResourceAccess({
  resourceClass,
  resourceLabel,
  verb,
  children,
}: KueueAdminResourceAccessProps) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  return (
    <>
      {allowed === null && <Loader title={`Checking access to Kueue ${resourceLabel}`} />}
      {allowed === false && (
        <SectionBox title={`Kueue ${resourceLabel}`}>
          <EmptyContent color="text.secondary">
            {`Kueue ${resourceLabel} are cluster-scoped admin resources. Your current Kubernetes credentials are not authorized to ${verb} them.`}
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
  );
}
