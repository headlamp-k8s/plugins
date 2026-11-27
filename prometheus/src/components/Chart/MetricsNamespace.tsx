import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { createContext, ReactNode } from 'react';
import { getConfigStore } from '../../util';

export const MetricsNamespaceContext = createContext<string | undefined>(undefined);

export function MetricsNamespace({
  namespace,
  children,
}: {
  namespace?: string;
  children: ReactNode;
}) {
  const cluster = K8s.useCluster();
  const useConfig = getConfigStore().useConfig();
  const config = useConfig();

  return (
    <MetricsNamespaceContext.Provider
      value={config?.[cluster]?.namespaceQueryParam ? namespace : undefined}
    >
      {children}
    </MetricsNamespaceContext.Provider>
  );
}
