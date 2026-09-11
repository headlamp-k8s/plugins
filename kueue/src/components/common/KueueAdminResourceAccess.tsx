import {
  AuthVisible,
  EmptyContent,
  Loader,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { ReactNode, useState } from 'react';

interface KueueAdminResourceAccessProps {
  /** Kueue resource class to check access for. */
  resourceClass: KubeObjectClass;
  /** Human-readable resource name shown in loading and denied messages. */
  resourceLabel: string;
  /** Kubernetes verb to verify before rendering the page. */
  verb: 'get' | 'list';
  /** Optional namespace for namespace-scoped resources. */
  namespace?: string;
  /** Optional sentence describing the resource scope in denied messages. */
  accessDescription?: string;
  /** Page content to render after the user is authorized. */
  children: ReactNode;
}

export default function KueueAdminResourceAccess({
  resourceClass,
  resourceLabel,
  verb,
  namespace,
  accessDescription = `Kueue ${resourceLabel} are cluster-scoped admin resources.`,
  children,
}: KueueAdminResourceAccessProps) {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [error, setError] = useState<Error | null>(null);

  return (
    <>
      {allowed === null && error === null && (
        <Loader title={`Checking access to Kueue ${resourceLabel}`} />
      )}
      {error !== null && (
        <SectionBox title={`Kueue ${resourceLabel}`}>
          <EmptyContent color="error.main">
            {`Failed to check access: ${error.message}`}
          </EmptyContent>
        </SectionBox>
      )}
      {allowed === false && error === null && (
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
        namespace={namespace}
        onAuthResult={result => setAllowed(result.allowed)}
        onError={err => setError(err)}
      >
        {children}
      </AuthVisible>
    </>
  );
}
