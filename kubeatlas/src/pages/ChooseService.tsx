/*
 * Copyright 2026 The KubeAtlas Authors
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

import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  Alert,
  Box,
  CircularProgress,
  Link,
  List,
  ListItemButton,
  ListItemText,
  Typography,
} from '@mui/material';
import { KubeAtlasService } from '../api/types';

// The KubeAtlas Helm chart labels its Service app.kubernetes.io/name=kubeatlas.
const KUBEATLAS_SERVICE_LABEL = 'app.kubernetes.io/name=kubeatlas';
const INSTALL_DOCS_URL = 'https://docs.kubeatlas.lithastra.com';

export interface ChooseServiceProps {
  onSelect: (svc: KubeAtlasService) => void;
}

// ChooseService lists every KubeAtlas Service in the cluster and lets
// the operator pick which one backs the graph. The plugin does not
// guess a namespace — a cluster may run more than one KubeAtlas.
export function ChooseService({ onSelect }: ChooseServiceProps) {
  const [services, error] = K8s.ResourceClasses.Service.useList({
    labelSelector: KUBEATLAS_SERVICE_LABEL,
  });

  if (error) {
    return <Alert severity="error">Could not list Services: {error.message}</Alert>;
  }

  if (services === null) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (services.length === 0) {
    return (
      <Alert severity="info">
        No KubeAtlas Service found in this cluster. Install KubeAtlas first — see the{' '}
        <Link href={INSTALL_DOCS_URL} target="_blank" rel="noopener noreferrer">
          installation docs
        </Link>
        .
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Choose a KubeAtlas service
      </Typography>
      <List>
        {services.map(svc => {
          const namespace = svc.metadata.namespace ?? '';
          const name = svc.metadata.name;
          const port = svc.spec?.ports?.[0]?.port ?? 8080;
          return (
            <ListItemButton
              key={`${namespace}/${name}`}
              onClick={() => onSelect({ namespace, name, port })}
            >
              <ListItemText primary={name} secondary={`namespace: ${namespace}`} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );
}
