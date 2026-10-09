// Embedded template DAG: rendered with Headlamp's native GraphView
// when the host exposes it, the local fallback renderer otherwise.
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { ResourceGraphDefinition } from '../resources/resourceGraphDefinition';
import EmbeddedGraphView from './EmbeddedGraphView';
import { getTemplateGraph, TEMPLATE_ROOT_ID } from './graphData';

/**
 * The RGD's template DAG: a synthetic root for the RGD, nodes from
 * spec.resources, edges from the dependency graph kro publishes in
 * status. Static per RGD revision.
 */
export default function TemplateGraphSection(props: { rgd: ResourceGraphDefinition }) {
  const { rgd } = props;
  // Watch updates mutate the KubeObject in place, so key the memo on
  // resourceVersion as well; graph identity drives the embedded view's
  // reload behavior, so it must be stable between real changes.
  const graph = useMemo(
    () => getTemplateGraph(rgd.jsonData),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rgd, rgd.metadata.resourceVersion]
  );

  if (graph.nodes.length === 0) {
    return null;
  }

  return (
    <SectionBox title="Template Graph">
      <EmbeddedGraphView
        graph={graph}
        sourceId="kro-embedded-template"
        sourceLabel="RGD template"
        defaultNodeSelection={TEMPLATE_ROOT_ID}
      />
    </SectionBox>
  );
}
