import {
  DateLabel,
  EmptyContent,
  Link,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { ResourceClasses } from '@kinvolk/headlamp-plugin/lib/k8s';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  instanceSubResourceSelector,
  KroInstance,
  makeInstanceClass,
} from '../../resources/instance';
import { ResourceGraphDefinition } from '../../resources/resourceGraphDefinition';
import { getComposedResources } from '../../resources/rgdGraph';
import { getNodeId, getResolvedValues, getSubResourceHealth } from '../../resources/subResources';

interface KindToWatch {
  /** Stable key for this kind, e.g. "apps/v1:Deployment". */
  key: string;
  apiVersion: string;
  kind: string;
}

/** Resolve a Headlamp resource class for an arbitrary apiVersion/kind. */
function resolveResourceClass(kindToWatch: KindToWatch): typeof KubeObject<any> | null {
  const builtIn = (ResourceClasses as Record<string, typeof KubeObject<any>>)[kindToWatch.kind];
  if (builtIn && builtIn.apiVersion === kindToWatch.apiVersion) {
    return builtIn;
  }
  const [group, version] = kindToWatch.apiVersion.includes('/')
    ? kindToWatch.apiVersion.split('/')
    : ['', kindToWatch.apiVersion];
  if (!version) {
    return builtIn ?? null;
  }
  if (builtIn) {
    return builtIn;
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

  useEffect(() => {
    onItems(kindKey, items ?? []);
  }, [items, kindKey, onItems]);

  return null;
}

/**
 * The resources kro created for this instance, discovered via kro's
 * ownership labels (kro.run/owned + kro.run/instance-id) across every
 * kind that appears in the RGD's templates.
 */
export default function SubResourcesSection(props: {
  rgd: ResourceGraphDefinition;
  instance: KubeObject<KroInstance>;
}) {
  const { rgd, instance } = props;
  const [itemsByKind, setItemsByKind] = useState<Record<string, KubeObject<any>[]>>({});

  const composedResources = useMemo(() => getComposedResources(rgd.jsonData), [rgd]);

  const kindsToWatch = useMemo(() => {
    const seen = new Map<string, KindToWatch>();
    for (const resource of composedResources) {
      if (resource.external || resource.kind === '-') {
        continue;
      }
      const key = `${resource.apiVersion}:${resource.kind}`;
      if (!seen.has(key)) {
        seen.set(key, { key, apiVersion: resource.apiVersion, kind: resource.kind });
      }
    }
    return [...seen.values()];
  }, [composedResources]);

  const nodeOrder = useMemo(
    () => new Map(composedResources.map((resource, index) => [resource.id, index])),
    [composedResources]
  );

  const onItems = useCallback((key: string, items: KubeObject<any>[]) => {
    setItemsByKind(previous => {
      const previousItems = previous[key];
      if (
        previousItems &&
        previousItems.length === items.length &&
        previousItems.every(
          (item, index) =>
            item.metadata.uid === items[index].metadata.uid &&
            item.metadata.resourceVersion === items[index].metadata.resourceVersion
        )
      ) {
        return previous;
      }
      return { ...previous, [key]: items };
    });
  }, []);

  const rows = useMemo(
    () =>
      Object.values(itemsByKind)
        .flat()
        .sort(
          (a, b) =>
            (nodeOrder.get(getNodeId(a.jsonData)) ?? Number.MAX_SAFE_INTEGER) -
            (nodeOrder.get(getNodeId(b.jsonData)) ?? Number.MAX_SAFE_INTEGER)
        ),
    [itemsByKind, nodeOrder]
  );

  const labelSelector = instanceSubResourceSelector(instance);

  return (
    <SectionBox title="Sub-resources">
      {kindsToWatch.map(kindToWatch => (
        <KindCollector
          key={kindToWatch.key}
          kindToWatch={kindToWatch}
          namespace={instance.metadata.namespace}
          labelSelector={labelSelector}
          onItems={onItems}
        />
      ))}
      {rows.length === 0 ? (
        <EmptyContent>No resources created for this instance yet.</EmptyContent>
      ) : (
        <SimpleTable
          columns={[
            {
              label: 'Graph Node',
              getter: (item: KubeObject<any>) => getNodeId(item.jsonData),
            },
            {
              label: 'Kind',
              getter: (item: KubeObject<any>) => item.kind,
            },
            {
              label: 'Name',
              getter: (item: KubeObject<any>) => (
                <Link kubeObject={item}>{item.metadata.name}</Link>
              ),
            },
            {
              label: 'Health',
              getter: (item: KubeObject<any>) => {
                const health = getSubResourceHealth(item.kind, item.jsonData);
                return health.status ? (
                  <StatusLabel status={health.status}>{health.label}</StatusLabel>
                ) : (
                  health.label
                );
              },
            },
            {
              label: 'Resolved Values',
              getter: (item: KubeObject<any>) => getResolvedValues(item.kind, item.jsonData) || '-',
            },
            {
              label: 'Age',
              getter: (item: KubeObject<any>) => (
                <DateLabel date={item.metadata.creationTimestamp} format="mini" />
              ),
            },
          ]}
          data={rows}
        />
      )}
    </SectionBox>
  );
}
