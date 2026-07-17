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
import { SubResourceCollectors, useCollectedSubResources } from './subResourceCollectors';

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
  const { items, onItems } = useCollectedSubResources();

  const nodeOrder = useMemo(
    () =>
      new Map(getComposedResources(rgd.jsonData).map((resource, index) => [resource.id, index])),
    [rgd]
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
      <SubResourceCollectors rgd={rgd} instance={instance} onItems={onItems} />
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
