import { ResourceClasses } from '@kinvolk/headlamp-plugin/lib/k8s';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  instanceSubResourceSelector,
  KroInstance,
  makeInstanceClass,
} from '../../resources/instance';
import { ResourceGraphDefinition } from '../../resources/resourceGraphDefinition';
import { getComposedResources } from '../../resources/rgdGraph';

export interface KindToWatch {
  /** Stable key for this kind, e.g. "apps/v1:Deployment". */
  key: string;
  apiVersion: string;
  kind: string;
}

/** Resolve a Headlamp resource class for an arbitrary apiVersion/kind. */
export function resolveResourceClass(kindToWatch: KindToWatch): typeof KubeObject<any> | null {
  const builtIn = (ResourceClasses as Record<string, typeof KubeObject<any>>)[kindToWatch.kind];
  if (builtIn) {
    return builtIn;
  }
  const [group, version] = kindToWatch.apiVersion.includes('/')
    ? kindToWatch.apiVersion.split('/')
    : ['', kindToWatch.apiVersion];
  if (!version) {
    return null;
  }
  // Best-effort guess for custom kinds; kro's own demo resources are all
  // built-ins, so this path only runs for third-party CRDs in templates.
  return makeInstanceClass({
    group,
    version,
    plural: `${kindToWatch.kind.toLowerCase()}s`,
    kind: kindToWatch.kind,
    isNamespaced: true,
  });
}

/** The unique template kinds of an RGD worth watching for sub-resources. */
export function getKindsToWatch(rgd: ResourceGraphDefinition): KindToWatch[] {
  const seen = new Map<string, KindToWatch>();
  for (const resource of getComposedResources(rgd.jsonData)) {
    if (resource.external || resource.kind === '-') {
      continue;
    }
    const key = `${resource.apiVersion}:${resource.kind}`;
    if (!seen.has(key)) {
      seen.set(key, { key, apiVersion: resource.apiVersion, kind: resource.kind });
    }
  }
  return [...seen.values()];
}

/**
 * Watches one kind with kro's instance labels and reports the matching
 * items up to the parent. Rendered as a component (not a hook loop) so
 * the number of hooks stays constant per kind even as RGDs change.
 */
function KindCollector(props: {
  kindToWatch: KindToWatch;
  namespace?: string;
  labelSelector: string;
  onItems: (key: string, items: KubeObject<any>[]) => void;
}) {
  const { kindToWatch, namespace, labelSelector, onItems } = props;
  const resourceClass = useMemo(() => resolveResourceClass(kindToWatch), [kindToWatch]);

  if (!resourceClass) {
    return null;
  }
  return (
    <KindCollectorList
      resourceClass={resourceClass}
      kindKey={kindToWatch.key}
      namespace={namespace}
      labelSelector={labelSelector}
      onItems={onItems}
    />
  );
}

function KindCollectorList(props: {
  resourceClass: typeof KubeObject<any>;
  kindKey: string;
  namespace?: string;
  labelSelector: string;
  onItems: (key: string, items: KubeObject<any>[]) => void;
}) {
  const { resourceClass, kindKey, namespace, labelSelector, onItems } = props;
  const [items] = resourceClass.useList({
    namespace: resourceClass.isNamespaced ? namespace : undefined,
    labelSelector,
  });

  // Report after every render, not keyed on array identity: watch
  // updates may mutate the underlying objects in place, so identity
  // checks can miss changes. The parent dedupes via resourceVersion
  // signatures.
  useEffect(() => {
    onItems(kindKey, items ?? []);
  });

  return null;
}

/**
 * State holder for items collected per kind. Updates are deduplicated
 * with uid/resourceVersion signatures captured as strings at report
 * time — comparing live object references would miss watch events that
 * mutate objects in place — and each accepted update stores a fresh
 * array so downstream memos recompute.
 */
export function useCollectedSubResources() {
  const [itemsByKind, setItemsByKind] = useState<Record<string, KubeObject<any>[]>>({});
  const signaturesByKind = useRef<Record<string, string>>({});

  const onItems = useCallback((key: string, items: KubeObject<any>[]) => {
    const signature = items
      .map(item => `${item.metadata.uid}:${item.metadata.resourceVersion}`)
      .join('|');
    if (signaturesByKind.current[key] === signature) {
      return;
    }
    signaturesByKind.current[key] = signature;
    setItemsByKind(previous => ({ ...previous, [key]: [...items] }));
  }, []);

  const items = useMemo(() => Object.values(itemsByKind).flat(), [itemsByKind]);

  return { items, onItems };
}

/**
 * Invisible watchers for every kind in the RGD's templates, matching the
 * resources kro created for this instance.
 */
export function SubResourceCollectors(props: {
  rgd: ResourceGraphDefinition;
  instance: KubeObject<KroInstance>;
  onItems: (key: string, items: KubeObject<any>[]) => void;
}) {
  const { rgd, instance, onItems } = props;
  const kindsToWatch = useMemo(() => getKindsToWatch(rgd), [rgd]);
  const labelSelector = instanceSubResourceSelector(instance);

  return (
    <>
      {kindsToWatch.map(kindToWatch => (
        <KindCollector
          key={kindToWatch.key}
          kindToWatch={kindToWatch}
          namespace={instance.metadata.namespace}
          labelSelector={labelSelector}
          onItems={onItems}
        />
      ))}
    </>
  );
}
