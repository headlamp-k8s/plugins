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
import {
  Link,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Typography } from '@mui/material';
import { Container, KRevision } from '../../../../../resources/knative';

/**
 * Represents a discrete specification of compute allocation constraints within the data grid.
 *
 * @property {string} type - Classifies the constraint category, typically distinguishing between 'Requests' and 'Limits'.
 * @property {string} cpu - The raw millicore or absolute allocation threshold specified for processing capacity.
 * @property {string} memory - The explicitly declared byte-formatted RAM allocation ceiling or baseline.
 */
export interface ResourceRow {
  type: string;
  cpu: string;
  memory: string;
}

/**
 * Defines the parameters supplied to the isolated container specification renderer.
 *
 * @property {Container[]} containers - The array of fundamental execution environments configured inside the deployment pod.
 * @property {string} namespace - The cluster isolation boundary in which these compute units are instantiated.
 */
export interface PureContainerSectionProps {
  containers: Container[];
  namespace: string;
}

type EnvVar = NonNullable<Container['env']>[number];

export function ContainerSection({ revision }: { revision: KRevision }) {
  const containers = revision.containers;
  if (!containers || containers.length === 0) return null;

  return (
    <>
      {containers.map((container: Container, idx: number) => {
        const resourceData: ResourceRow[] = [];
        if (container.resources?.requests) {
          resourceData.push({
            type: 'Requests',
            cpu: container.resources.requests.cpu || '-',
            memory: container.resources.requests.memory || '-',
          });
        }
        if (container.resources?.limits) {
          resourceData.push({
            type: 'Limits',
            cpu: container.resources.limits.cpu || '-',
            memory: container.resources.limits.memory || '-',
          });
        }

        const envData = container.env || [];

        return (
          <SectionBox title={`Container: ${container.name || 'user-container'}`} key={idx}>
            {/* Image and Ports */}
            <NameValueTable
              rows={[
                {
                  name: 'Image',
                  value: (
                    <Typography sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {container.image}
                    </Typography>
                  ),
                },
                {
                  name: 'Ports',
                  value:
                    container.ports
                      ?.map(p => `${p.containerPort}${p.name ? ` (${p.name})` : ''}`)
                      .join(', ') || '-',
                },
              ]}
            />

            {/* Compute Resources */}
            {resourceData.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, fontSize: '1.1rem' }}>
                  Compute Resources
                </Typography>
                <SimpleTable
                  columns={[
                    {
                      label: 'Type',
                      getter: (row: ResourceRow) => row.type,
                      sort: (a: ResourceRow, b: ResourceRow) => a.type.localeCompare(b.type),
                    },
                    {
                      label: 'CPU',
                      getter: (row: ResourceRow) => row.cpu,
                    },
                    {
                      label: 'Memory',
                      getter: (row: ResourceRow) => row.memory,
                    },
                  ]}
                  data={resourceData}
                />
              </Box>
            )}

            {/* Environment Variables */}
            {envData.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2, fontSize: '1.1rem' }}>
                  Environment Variables
                </Typography>
                <SimpleTable
                  columns={[
                    {
                      label: 'Name',
                      getter: (env: EnvVar) => (
                        <Typography sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                          {env.name}
                        </Typography>
                      ),
                    },
                    {
                      label: 'Value',
                      getter: (env: EnvVar) => {
                        if (env.value !== undefined) {
                          return (
                            <Typography sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                              {env.value}
                            </Typography>
                          );
                        }
                        if (env.valueFrom?.secretKeyRef) {
                          return (
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
                          );
                        }
                        if (env.valueFrom?.configMapKeyRef) {
                          return (
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
                          );
                        }
                        return '-';
                      },
                    },
                  ]}
                  data={envData}
                />
              </Box>
            )}
          </SectionBox>
        );
      })}
    </>
  );
}
