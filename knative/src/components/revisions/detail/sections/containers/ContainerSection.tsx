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

import { Icon } from '@iconify/react';
import { Link, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { Container, KRevision } from '../../../../../resources/knative';

export function ContainerSection({ revision }: { revision: KRevision }) {
  const containers = revision.containers;
  if (!containers || containers.length === 0) return null;

  return (
    <>
      {containers.map((container: Container, idx: number) => (
        <SectionBox title={`Container: ${container.name || 'user-container'}`} key={idx}>
          {/* Images and Ports */}
          <Table size="small" sx={{ mb: 3 }}>
            <TableBody>
              <TableRow>
                <TableCell sx={{ width: '20%', fontWeight: 'bold' }}>Image</TableCell>
                <TableCell sx={{ fontFamily: 'monospace' }}>{container.image}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Ports</TableCell>
                <TableCell>
                  {container.ports
                    ?.map(p => `${p.containerPort}${p.name ? ` (${p.name})` : ''}`)
                    .join(', ') || '-'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          {/* Resources */}
          {(container.resources?.requests || container.resources?.limits) && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1, fontSize: '1.1rem' }}>
                Compute Resources
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>CPU</TableCell>
                    <TableCell>Memory</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {container.resources.requests && (
                    <TableRow>
                      <TableCell>Requests</TableCell>
                      <TableCell>{container.resources.requests.cpu || '-'}</TableCell>
                      <TableCell>{container.resources.requests.memory || '-'}</TableCell>
                    </TableRow>
                  )}
                  {container.resources.limits && (
                    <TableRow>
                      <TableCell>Limits</TableCell>
                      <TableCell>{container.resources.limits.cpu || '-'}</TableCell>
                      <TableCell>{container.resources.limits.memory || '-'}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          )}
          {/* Environment Variables */}
          {container.env && container.env.length > 0 && (
            <Box>
              <Typography variant="h6" sx={{ mb: 1, fontSize: '1.1rem' }}>
                Environment Variables
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {container.env.map((env, i) => (
                    <TableRow key={env.name || i}>
                      <TableCell sx={{ fontWeight: 'bold' }}>{env.name}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace' }}>
                        {env.value !== undefined ? (
                          env.value
                        ) : env.valueFrom?.secretKeyRef ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Icon icon="mdi:lock-outline" />
                            <Link
                              routeName="secret"
                              params={{
                                name: env.valueFrom.secretKeyRef.name,
                                namespace: revision.metadata.namespace,
                              }}
                            >
                              {env.valueFrom.secretKeyRef.name}
                            </Link>
                            <Typography variant="caption" color="text.secondary">
                              (key: {env.valueFrom.secretKeyRef.key})
                            </Typography>
                          </Box>
                        ) : env.valueFrom?.configMapKeyRef ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Link
                              routeName="configmap"
                              params={{
                                name: env.valueFrom.configMapKeyRef.name,
                                namespace: revision.metadata.namespace,
                              }}
                            >
                              {env.valueFrom.configMapKeyRef.name}
                            </Link>
                            <Typography variant="caption" color="text.secondary">
                              (key: {env.valueFrom.configMapKeyRef.key})
                            </Typography>
                          </Box>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </SectionBox>
      ))}
    </>
  );
}
