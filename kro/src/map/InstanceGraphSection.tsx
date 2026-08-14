// Embedded live instance graph: rendered with Headlamp's native
// GraphView when the host exposes it, the local fallback renderer
// otherwise. On the native path the always-enabled global kro source
// contributes its RGD "defines" edges too, so the visible component is
// the instance in its kro context (its resources, its RGD, sibling
// instances) rather than the instance subtree alone.
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { useMemo } from 'react';
import { KroInstance } from '../resources/instance';
import { ResourceGraphDefinition } from '../resources/resourceGraphDefinition';
import EmbeddedGraphView from './EmbeddedGraphView';
import { getInstanceGraph } from './graphData';

/**
 * Live resource graph for one instance: the instance node plus the
 * resources kro actually created. Presentational — the caller owns the
 * sub-resource watches and passes the collected items in, so the graph
 * and the sub-resources table always render from the same data.
 */
export default function InstanceGraphSection(props: {
  rgd: ResourceGraphDefinition;
  instance: KubeObject<KroInstance>;
  items: KubeObject<any>[];
}) {
  const { rgd, instance, items } = props;

  // Headlamp's watch updates mutate KubeObject instances in place, so
  // object identity alone would freeze the graph — resourceVersions
  // cover in-place mutation, and `items` identity already changes
  // exactly when collected content changes (useCollectedSubResources
  // dedupes by signature). Stability matters now: the embedded native
  // view reloads and re-lays-out whenever graph identity changes.
  const graph = useMemo(
    () => getInstanceGraph(rgd.jsonData, instance, items),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rgd, rgd.metadata.resourceVersion, instance, instance.metadata.resourceVersion, items]
  );

  return (
    <SectionBox title="Resource Graph">
      <EmbeddedGraphView
        graph={graph}
        sourceId="kro-embedded-instance"
        sourceLabel="Instance resources"
        defaultNodeSelection={instance.metadata.uid}
      />
    </SectionBox>
  );
}
