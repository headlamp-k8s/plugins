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

import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box } from '@mui/material';
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
import { KServiceHeaderActions } from './detail/header/KServiceHeaderActions';
import { KServiceLogsHeaderButton } from './detail/header/KServiceLogsHeaderButton';
import { KServiceViewYamlHeaderButton } from './detail/header/KServiceViewYamlHeaderButton';
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

  return isKnativeInstalled ? (
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
                      id: 'knative.kservice-redeploy',
                      action: (
                        <KServicePermissionsProvider kservice={resource}>
                          <KServiceHeaderActions kservice={resource} />
                        </KServicePermissionsProvider>
                      ),
                    },
                    {
                      id: 'knative-kservice-logs',
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
            extraInfo={resource =>
              resource
                ? [
                    {
                      name: 'Ingress Class',
                      value: <IngressClassValue cluster={resource.cluster} />,
                    },
                  ]
                : null
            }
            extraSections={item =>
              item
                ? [
                    {
                      id: 'knative.kservice-overview',
                      section: <OverviewSection kservice={item} />,
                    },
                    {
                      id: 'knative.kservice-pods',
                      section: <PodsSection kservice={item} />,
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
  );
}
