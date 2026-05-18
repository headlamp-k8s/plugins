/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/system';
import { KRevision } from '../../resources/knative';

/**
 * Props for the Glance component.
 * Headlamp's map source provides a GraphNode-like object.
 */
interface GlanceProps {
  /** The node object from Headlamp's map source. */
  node: any;
}

/**
 * Renders a brief "glance" summary for a Revision on the map.
 * Displays ready status and parent service name.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function RevisionGlance({ node }: GlanceProps) {
  const kubeObject = node.kubeObject;
  const isKnativeRevision =
    kubeObject instanceof KRevision ||
    (kubeObject?.kind === KRevision.kind &&
      typeof kubeObject?.apiVersion === 'string' &&
      kubeObject.apiVersion.startsWith('serving.knative.dev/'));

  if (isKnativeRevision) {
    const rev = kubeObject as KRevision;
    const readyStatus = rev.isReady ? 'True' : 'False';

    let trafficStr: string | null = null;
    let tagsStr: string | null = null;

    if (node.traffic?.length) {
      const percents: string[] = [];
      const tags: string[] = [];
      for (const t of node.traffic) {
        percents.push(`${t.percent || 0}%`);
        if (t.tag) tags.push(t.tag);
      }
      trafficStr = percents.join(', ');
      tagsStr = tags.length ? tags.join(', ') : null;
    }

    return (
      <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="revision-glance">
        <StatusLabel status={rev.isReady ? 'success' : 'error'}>Ready: {readyStatus}</StatusLabel>
        {rev.parentService && <StatusLabel>Service: {rev.parentService}</StatusLabel>}
        {trafficStr && <StatusLabel>Traffic: {trafficStr}</StatusLabel>}
        {tagsStr && <StatusLabel>Tags: {tagsStr}</StatusLabel>}
        {rev.primaryImage && (
          <StatusLabel>
            Image: {rev.primaryImage.split('/').pop()?.split('@')[0] || rev.primaryImage}
          </StatusLabel>
        )}
      </Box>
    );
  }

  return null;
}
