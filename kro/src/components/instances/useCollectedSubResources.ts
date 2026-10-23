// The pure state half of the sub-resource collectors, kept free of
// host-only imports so it stays unit-testable under vitest.
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { useCallback, useMemo, useRef, useState } from 'react';

/** An error reported while listing one watched kind. */
export interface SubResourceListError {
  /** The kind whose list/watch failed. */
  kind: string;
  /** The server's error message (e.g. an RBAC denial). */
  message: string;
}

/**
 * State holder for items collected per kind. Updates are deduplicated
 * with uid/resourceVersion signatures captured as strings at report
 * time — comparing live object references would miss watch events that
 * mutate objects in place — and each accepted update stores a fresh
 * array so downstream memos recompute. List errors (e.g. RBAC denials)
 * are collected per kind so sections can degrade with the server's
 * message instead of showing an empty state. Reporting no items and no
 * error for a kind drops its entry, which is how collectors that go
 * away (a kind removed from the RGD's templates) prune their state.
 * `items` holds each object once even when two collectors report it,
 * as happens when templates use two served versions of one custom kind
 * and both resolve to the same class.
 *
 * @returns `items` (all collected resources), `errors` (one per failing
 *   kind), and the `onItems` callback to hand to
 *   {@link SubResourceCollectors}.
 */
export function useCollectedSubResources() {
  const [itemsByKind, setItemsByKind] = useState<Record<string, KubeObject<any>[]>>({});
  const [errorsByKind, setErrorsByKind] = useState<Record<string, SubResourceListError>>({});
  const signaturesByKind = useRef<Record<string, string>>({});

  const onItems = useCallback(
    (key: string, items: KubeObject<any>[], error: SubResourceListError | null) => {
      const signature =
        items.map(item => `${item.metadata.uid}:${item.metadata.resourceVersion}`).join('|') +
        `|error:${error?.message ?? ''}`;
      if (signaturesByKind.current[key] === signature) {
        return;
      }
      signaturesByKind.current[key] = signature;
      setItemsByKind(previous => {
        if (items.length > 0) {
          return { ...previous, [key]: [...items] };
        }
        if (!(key in previous)) {
          return previous;
        }
        const next = { ...previous };
        delete next[key];
        return next;
      });
      setErrorsByKind(previous => {
        if (error) {
          return { ...previous, [key]: error };
        }
        if (!(key in previous)) {
          return previous;
        }
        const next = { ...previous };
        delete next[key];
        return next;
      });
    },
    []
  );

  const items = useMemo(() => {
    const seenUids = new Set<string>();
    return Object.values(itemsByKind)
      .flat()
      .filter(item => {
        if (seenUids.has(item.metadata.uid)) {
          return false;
        }
        seenUids.add(item.metadata.uid);
        return true;
      });
  }, [itemsByKind]);
  const errors = useMemo(() => Object.values(errorsByKind), [errorsByKind]);

  return { items, errors, onItems };
}
