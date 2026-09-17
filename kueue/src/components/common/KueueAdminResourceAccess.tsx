import {
  AuthVisible,
  EmptyContent,
  Loader,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { ReactNode, useState } from 'react';
import { resolveAuthNamespace } from '../../utils/authNamespace';

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
      <AuthVisible
        item={resourceClass}
        authVerb={verb}
        namespace={resolveAuthNamespace(resourceClass, namespace)}
        onAuthResult={result => setAllowed(result.allowed)}
        onError={() => setAllowed(false)}
      >
        {children}
      </AuthVisible>
    </>
  );
}
