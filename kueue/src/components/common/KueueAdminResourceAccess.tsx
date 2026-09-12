import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
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
  /** Optional sentence describing the resource scope in denied messages. */
  accessDescription?: string;
  /** Page content to render after the user is authorized. */
  children: ReactNode;
}

export default function KueueAdminResourceAccess({
  resourceClass,
  resourceLabel,
  verb,
  accessDescription,
  children,
}: KueueAdminResourceAccessProps) {
  const { t } = useTranslation();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  const defaultDescription =
    accessDescription ||
    t('Kueue {{resourceLabel}} are cluster-scoped admin resources.', { resourceLabel });

  return (
    <>
      {allowed === null && (
        <Loader title={t('Checking access to Kueue {{resourceLabel}}', { resourceLabel })} />
      )}
      {allowed === false && (
        <SectionBox title={t('Kueue {{resourceLabel}}', { resourceLabel })}>
          <EmptyContent color="text.secondary">
            {t(
              '{{description}} Your current Kubernetes credentials are not authorized to {{action}} this page.',
              {
                description: defaultDescription,
                action: verb === 'get' ? t('view') : t('list'),
              }
            )}
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
