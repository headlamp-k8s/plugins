import { ResourceClasses } from '@kinvolk/headlamp-plugin/lib/k8s';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  instanceSubResourceSelector,
  KroInstance,
  makeInstanceClass,
} from '../../resources/instance';
import { InstanceApiInfo, instanceApiInfoFromCrdSpec } from '../../resources/instanceApi';
import { ResourceGraphDefinition } from '../../resources/resourceGraphDefinition';
import { getComposedResources } from '../../resources/rgdGraph';

export interface KindToWatch {
  /** Stable key for this kind, e.g. "apps/v1:Deployment". */
  key: string;
  apiVersion: string;
  kind: string;
}

/** An error reported while listing one watched kind. */
export interface SubResourceListError {
  kind: string;
  message: string;
}

function apiGroupOf(apiVersion: string): string {
  return apiVersion.includes('/') ? apiVersion.split('/')[0] : '';
}

/**
 * Resolve a Headlamp resource class for an arbitrary apiVersion/kind:
 * a built-in class when the apiVersion matches, else the cluster's CRD
 * for that group+kind (the CRD is the source of truth for the plural
 * name and scope — never guessed). Unknown kinds are skipped.
 */
export function resolveResourceClass(
  kindToWatch: KindToWatch,
  crdApiInfoByGroupKind: Map<string, InstanceApiInfo>
): typeof KubeObject<any> | null {
  const builtIn = (ResourceClasses as Record<string, typeof KubeObject<any>>)[kindToWatch.kind];
  if (builtIn && builtIn.apiVersion === kindToWatch.apiVersion) {
    return builtIn;
  }
  const crdInfo = crdApiInfoByGroupKind.get(
    `${apiGroupOf(kindToWatch.apiVersion)}/${kindToWatch.kind}`
  );
  if (crdInfo) {
    return makeInstanceClass(crdInfo);
  }
  return builtIn ?? null;
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
  crdApiInfoByGroupKind: Map<string, InstanceApiInfo>;
  namespace?: string;
  labelSelector: string;
  onItems: (key: string, items: KubeObject<any>[], error: SubResourceListError | null) => void;
}) {
  const { kindToWatch, crdApiInfoByGroupKind, namespace, labelSelector, onItems } = props;
  const resourceClass = useMemo(
    () => resolveResourceClass(kindToWatch, crdApiInfoByGroupKind),
    [kindToWatch, crdApiInfoByGroupKind]
  );

  if (!resourceClass) {
    return null;
  }
  return (
    <KindCollectorList
      resourceClass={resourceClass}
      kindKey={kindToWatch.key}
      kind={kindToWatch.kind}
      namespace={namespace}
      labelSelector={labelSelector}
      onItems={onItems}
    />
  );
}

function KindCollectorList(props: {
  resourceClass: typeof KubeObject<any>;
  kindKey: string;
  kind: string;
  namespace?: string;
  labelSelector: string;
  onItems: (key: string, items: KubeObject<any>[], error: SubResourceListError | null) => void;
}) {
  const { resourceClass, kindKey, kind, namespace, labelSelector, onItems } = props;
  const [items, error] = resourceClass.useList({
    namespace: resourceClass.isNamespaced ? namespace : undefined,
    labelSelector,
  });

  // Report after every render, not keyed on array identity: watch
  // updates may mutate the underlying objects in place, so identity
  // checks can miss changes. The parent dedupes via resourceVersion
  // signatures.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    onItems(kindKey, items ?? [], error ? { kind, message: error.message ?? String(error) } : null);
  });

  return null;
}

/**
 * State holder for items collected per kind. Updates are deduplicated
 * with uid/resourceVersion signatures captured as strings at report
 * time — comparing live object references would miss watch events that
 * mutate objects in place — and each accepted update stores a fresh
 * array so downstream memos recompute. List errors (e.g. RBAC denials)
 * are collected per kind so sections can degrade with the server's
 * message instead of showing an empty state.
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
      setItemsByKind(previous => ({ ...previous, [key]: [...items] }));
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

  const items = useMemo(() => Object.values(itemsByKind).flat(), [itemsByKind]);
  const errors = useMemo(() => Object.values(errorsByKind), [errorsByKind]);

  return { items, errors, onItems };
}

/**
 * Invisible watchers for every kind in the RGD's templates, matching the
 * resources kro created for this instance.
 */
export function SubResourceCollectors(props: {
  rgd: ResourceGraphDefinition;
  instance: KubeObject<KroInstance>;
  onItems: (key: string, items: KubeObject<any>[], error: SubResourceListError | null) => void;
}) {
  const { rgd, instance, onItems } = props;
  const kindsToWatch = useMemo(() => getKindsToWatch(rgd), [rgd]);
  const labelSelector = instanceSubResourceSelector(instance);

  // The CRD list backs plural/scope resolution for any non-built-in
  // kinds appearing in templates.
  const [crds] = CustomResourceDefinition.useList();
  const crdApiInfoByGroupKind = useMemo(() => {
    const byGroupKind = new Map<string, InstanceApiInfo>();
    for (const crd of crds ?? []) {
      const info = instanceApiInfoFromCrdSpec(crd.jsonData.spec);
      if (info) {
        byGroupKind.set(`${info.group}/${info.kind}`, info);
      }
    }
    return byGroupKind;
  }, [crds]);

  return (
    <>
      {kindsToWatch.map(kindToWatch => (
        <KindCollector
          key={kindToWatch.key}
          kindToWatch={kindToWatch}
          crdApiInfoByGroupKind={crdApiInfoByGroupKind}
          namespace={instance.metadata.namespace}
          labelSelector={labelSelector}
          onItems={onItems}
        />
      ))}
    </>
  );
}
