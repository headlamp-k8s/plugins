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
import { KService } from '../../resources/knative';

/**
 * Props for the Glance component.
 * Headlamp's map source provides a GraphNode-like object.
 */
interface GlanceProps {
  /** The node object from Headlamp's map source. */
  node: any;
}

/**
 * Renders a brief "glance" summary for a KService on the map.
 * Displays ready status, URL, and latest revision info.
 *
 * @param props - Component properties.
 * @param props.node - The map node containing the resource.
 */
export function KServiceGlance({ node }: GlanceProps) {
  const kubeObject = node.kubeObject;
  const isKnativeService =
    kubeObject?.kind === KService.kind &&
    typeof kubeObject?.apiVersion === 'string' &&
    kubeObject.apiVersion.startsWith('serving.knative.dev/');

  if (isKnativeService) {
    const svc = kubeObject as KService;
    const readyCond = svc.status?.conditions?.find(c => c.type === 'Ready');
    const readyStatus = readyCond?.status || 'Unknown';

    return (
      <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="kservice-glance">
        <StatusLabel
          status={readyStatus === 'True' ? 'success' : readyStatus === 'False' ? 'error' : ''}
        >
          Ready: {readyStatus}
        </StatusLabel>
        {svc.status?.latestReadyRevisionName && (
          <StatusLabel status="">Latest: {svc.status.latestReadyRevisionName}</StatusLabel>
        )}
      </Box>
    );
  }

  return null;
}
