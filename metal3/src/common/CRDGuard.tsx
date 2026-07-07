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

import { Loader } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface CRDGuardProps {
  /** Full CRD name, e.g. "baremetalhosts.metal3.io". */
  crdName: string;
  /** Human-readable resource label used in the messages. */
  resourceLabel: string;
  /** Content rendered once the CRD is confirmed present. */
  children: ReactNode;
}

/**
 * Renders its children only when the named CRD is present in the cluster.
 *
 * While presence is being detected it shows a loader, and when the CRD is
 * absent it shows an explanatory message instead of an empty or erroring view,
 * so the plugin degrades gracefully on clusters where the corresponding Metal3
 * operator is not installed. The detection logic lives here once and is reused
 * per resource by passing a different `crdName`.
 *
 * @param props.crdName - Full CRD name to look up, e.g. "baremetalhosts.metal3.io".
 * @param props.resourceLabel - Human-readable label used in the loader and message.
 * @param props.children - Content rendered once the CRD is present.
 */
export function CRDGuard({ crdName, resourceLabel, children }: CRDGuardProps) {
  const [crd, error] = CustomResourceDefinition.useGet(crdName);

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          {resourceLabel} is not available
        </Typography>
        <Typography variant="body2" color="textSecondary">
          The {crdName} CRD could not be read in this cluster. It may not be installed, or you may
          not have permission to read it. Install the corresponding Metal3 operator and check your
          access to view {resourceLabel} objects in this cluster.
        </Typography>
      </Box>
    );
  }

  if (!crd) {
    return <Loader title={`Detecting ${resourceLabel} CRD…`} />;
  }

  return <>{children}</>;
}
