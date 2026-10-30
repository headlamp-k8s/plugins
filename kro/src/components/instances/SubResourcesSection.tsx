import {
  DateLabel,
  EmptyContent,
  Link,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { useMemo } from 'react';
import { KroInstance } from '../../resources/instance';
import { ResourceGraphDefinition } from '../../resources/resourceGraphDefinition';
import { getComposedResources } from '../../resources/rgdGraph';
import { getNodeId, getResolvedValues, getSubResourceHealth } from '../../resources/subResources';
import {
  SubResourceCollectors,
  SubResourceListError,
  useCollectedSubResources,
} from './subResourceCollectors';

/**
 * The resources kro created for this instance, discovered via kro's
 * ownership labels (kro.run/owned + kro.run/instance-id) across every
 * kind that appears in the RGD's templates. Per-kind list errors
 * (e.g. RBAC denials) render as messages instead of an empty state.
 * When the caller already watches the sub-resources it can pass the
 * collected items and errors in and this section renders purely from
 * them.
 *
 * @param props.rgd - The RGD defining the instance's resource graph.
 * @param props.instance - The instance whose sub-resources to show.
 * @param props.itemsOverride - Pre-collected items from a caller-owned
 *   watch set; when set, this section starts no watches of its own.
 * @param props.errorsOverride - Pre-collected per-kind list errors
 *   accompanying itemsOverride.
 * @returns The Sub-resources section.
 */
export default function SubResourcesSection(props: {
  rgd: ResourceGraphDefinition;
  instance: KubeObject<KroInstance>;
  itemsOverride?: KubeObject<any>[];
  errorsOverride?: SubResourceListError[];
}) {
  const { rgd, instance, itemsOverride, errorsOverride } = props;
  const { items: collectedItems, errors: collectedErrors, onItems } = useCollectedSubResources();
  const items = itemsOverride ?? collectedItems;
  const errors = errorsOverride ?? collectedErrors;

  // Keyed on resourceVersion as well as identity: watch updates can
  // mutate the RGD object in place, so identity alone can go stale.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const nodeOrder = useMemo(
    () =>
      new Map(getComposedResources(rgd.jsonData).map((resource, index) => [resource.id, index])),
    [rgd, rgd.metadata.uid, rgd.metadata.resourceVersion]
  );

  const rows = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          (nodeOrder.get(getNodeId(a.jsonData)) ?? Number.MAX_SAFE_INTEGER) -
          (nodeOrder.get(getNodeId(b.jsonData)) ?? Number.MAX_SAFE_INTEGER)
      ),
    [items, nodeOrder]
  );

  return (
    <SectionBox title="Sub-resources">
      {!itemsOverride && <SubResourceCollectors rgd={rgd} instance={instance} onItems={onItems} />}
      {errors.map(listError => (
        <EmptyContent key={listError.kind}>
          Unable to list {listError.kind}: {listError.message}
        </EmptyContent>
      ))}
      {rows.length === 0 ? (
        errors.length === 0 && (
          <EmptyContent>No resources created for this instance yet.</EmptyContent>
        )
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
