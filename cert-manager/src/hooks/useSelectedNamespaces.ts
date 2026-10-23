import { useMemo } from 'react';
import { useSelector } from 'react-redux';

export function useSelectedNamespaces() {
  const namespaces = useSelector(
    ({ filter }: { filter: { namespaces: Set<string> } }) => filter.namespaces
  );
  return useMemo(() => (namespaces.size ? [...namespaces] : undefined), [namespaces]);
}
