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

import { DetailsGrid, Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { useClusters } from '../../hooks/useClusters';
import { useKnativeInstalled } from '../../hooks/useKnativeInstalled';
import { KService } from '../../resources/knative';
import {
  ActivitiesProvider,
  ActivitiesRenderer,
  KNATIVE_ACTIVITY_CONTAINER_ID,
} from '../common/activity/Activity';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import { KServiceEditToggleHeaderAction } from './detail/header/KServiceEditToggleHeaderAction';
import { KServiceHeaderActions } from './detail/header/KServiceHeaderActions';
import { KServiceLogsHeaderButton } from './detail/header/KServiceLogsHeaderButton';
import { KServiceViewYamlHeaderButton } from './detail/header/KServiceViewYamlHeaderButton';
import { KServiceEditContextProvider } from './detail/hooks/useKServiceEditMode';
import { KServicePermissionsProvider } from './detail/permissions/KServicePermissionsProvider';
import { AutoscalingSection } from './detail/sections/autoscaling/AutoscalingSection';
import { IngressClassValue } from './detail/sections/networking/NetworkingSection';
import { NetworkingSection } from './detail/sections/networking/NetworkingSection';
import { OverviewSection } from './detail/sections/overview/OverviewSection';
import { PodsSection } from './detail/sections/pods/PodsSection';
import { TrafficSection } from './detail/sections/traffic/TrafficSection';

export function KServiceDetail() {
  const { name, namespace } = useParams<{ namespace: string; name: string }>();
  const clusters = useClusters();
  const { isKnativeInstalled, isKnativeCheckLoading } = useKnativeInstalled(clusters);
  return (
    <KServiceEditContextProvider>
      {isKnativeInstalled ? (
        <ActivitiesProvider>
          <Box
            sx={{
              display: 'grid',
              overflow: 'hidden',
              flexGrow: 1,
              height: '100%',
              position: 'relative',
              gridTemplateRows: '1fr min-content',
              gridTemplateColumns: '1fr',
              minHeight: 0,
            }}
          >
            <Box
              id={KNATIVE_ACTIVITY_CONTAINER_ID}
              sx={{
                overflow: 'auto',
                position: 'relative',
                height: '100%',
                minHeight: 0,
                gridColumn: '1 / 2',
                gridRow: '1 / 2',
              }}
            >
              <DetailsGrid
                resourceType={KService}
                name={name}
                namespace={namespace}
                withEvents
                actions={resource =>
                  resource
                    ? [
                        {
                          id: 'knative.kservice-edit-toggle',
                          action: (
                            <KServicePermissionsProvider kservice={resource}>
                              <KServiceEditToggleHeaderAction />
                            </KServicePermissionsProvider>
                          ),
                        },
                        {
                          id: 'knative.kservice-actions-divider',
                          action: (
                            <Divider
                              orientation="vertical"
                              flexItem
                              sx={{ mx: 1, height: '20px', alignSelf: 'center' }}
                            />
                          ),
                        },
                        {
                          id: 'knative.kservice-redeploy',
                          action: (
                            <KServicePermissionsProvider kservice={resource}>
                              <KServiceHeaderActions kservice={resource} />
                            </KServicePermissionsProvider>
                          ),
                        },
                        {
                          id: 'knative.kservice-logs',
                          action: (
                            <KServicePermissionsProvider kservice={resource}>
                              <KServiceLogsHeaderButton kservice={resource} />
                            </KServicePermissionsProvider>
                          ),
                        },
                        {
                          id: 'knative.kservice-view-yaml',
                          action: (
                            <KServicePermissionsProvider kservice={resource}>
                              <KServiceViewYamlHeaderButton kservice={resource} />
                            </KServicePermissionsProvider>
                          ),
                        },
                      ]
                    : null
                }
                extraInfo={svc => {
                  if (!svc) return null;

                  const readyCond = svc.status?.conditions?.find(c => c.type === 'Ready');
                  const readyStatus = readyCond?.status || 'Unknown';

                  const visibility =
                    svc.metadata?.labels?.['networking.knative.dev/visibility'] === 'cluster-local'
                      ? 'Internal'
                      : 'External';

                  return [
                    {
                      name: 'Ready',
                      value: (
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Chip
                            label={readyStatus}
                            color={
                              readyStatus === 'True'
                                ? 'success'
                                : readyStatus === 'False'
                                ? 'error'
                                : 'default'
                            }
                            size="small"
                            variant="outlined"
                          />
                        </Stack>
                      ),
                    },
                    {
                      name: 'Visibility',
                      value: (
                        <Chip
                          label={visibility}
                          color={visibility === 'Internal' ? 'default' : 'primary'}
                          size="small"
                        />
                      ),
                    },
                    {
                      name: 'URL',
                      value: svc.status?.url ? (
                        <a href={svc.status.url} target="_blank" rel="noopener noreferrer">
                          {svc.status.url}
                        </a>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      ),
                    },
                    {
                      name: 'Latest Created',
                      value: svc.status?.latestCreatedRevisionName ? (
                        <Link
                          routeName="revisionDetails"
                          params={{
                            namespace: svc.metadata.namespace,
                            name: svc.status.latestCreatedRevisionName,
                          }}
                          activeCluster={svc.cluster}
                        >
                          {svc.status.latestCreatedRevisionName}
                        </Link>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      ),
                    },
                    {
                      name: 'Latest Ready',
                      value: svc.status?.latestReadyRevisionName ? (
                        <Link
                          routeName="revisionDetails"
                          params={{
                            namespace: svc.metadata.namespace,
                            name: svc.status.latestReadyRevisionName,
                          }}
                          activeCluster={svc.cluster}
                        >
                          {svc.status.latestReadyRevisionName}
                        </Link>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          -
                        </Typography>
                      ),
                    },
                    {
                      name: 'Ingress Class',
                      value: <IngressClassValue cluster={svc.cluster} />,
                    },
                  ];
                }}
                extraSections={item =>
                  item
                    ? [
                        {
                          id: 'knative.kservice-overview',
                          section: <OverviewSection kservice={item} />,
                        },
                        {
                          id: 'knative.kservice-pods',
                          section: (
                            <Box mt={2}>
                              <PodsSection kservice={item} />
                            </Box>
                          ),
                        },
                        {
                          id: 'knative.kservice-traffic',
                          section: (
                            <KServicePermissionsProvider kservice={item}>
                              <TrafficSection kservice={item} />
                            </KServicePermissionsProvider>
                          ),
                        },
                        {
                          id: 'knative.kservice-networking',
                          section: (
                            <KServicePermissionsProvider kservice={item}>
                              <NetworkingSection kservice={item} />
                            </KServicePermissionsProvider>
                          ),
                        },
                        {
                          id: 'knative.kservice-autoscaling',
                          section: (
                            <KServicePermissionsProvider kservice={item}>
                              <AutoscalingSection kservice={item} />
                            </KServicePermissionsProvider>
                          ),
                        },
                      ]
                    : []
                }
              />
            </Box>
            <ActivitiesRenderer />
          </Box>
        </ActivitiesProvider>
      ) : (
        <NotInstalledBanner isLoading={isKnativeCheckLoading} />
      )}
    </KServiceEditContextProvider>
  );
}
