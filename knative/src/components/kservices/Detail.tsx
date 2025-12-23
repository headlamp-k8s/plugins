import { Box } from '@mui/material';
import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import {
  ActivitiesProvider,
  ActivitiesRenderer,
  KNATIVE_ACTIVITY_CONTAINER_ID,
} from '../common/activity/Activity';
import { NotInstalledBanner } from '../common/NotInstalledBanner';
import { useClusters } from '../../hooks/useClusters';
import { useKnativeInstalled } from '../../hooks/useKnativeInstalled';
import { KService } from '../../resources/knative';
import { KServiceHeaderActions } from './detail/header/KServiceHeaderActions';
import { KServiceLogsHeaderButton } from './detail/header/KServiceLogsHeaderButton';
import { KServiceViewYamlHeaderButton } from './detail/header/KServiceViewYamlHeaderButton';
import { IngressClassValue } from './detail/sections/networking/NetworkingSection';
import { OverviewSection } from './detail/sections/overview/OverviewSection';
import { PodsSection } from './detail/sections/pods/PodsSection';
import { TrafficSection } from './detail/sections/traffic/TrafficSection';
import { NetworkingSection } from './detail/sections/networking/NetworkingSection';
import { AutoscalingSection } from './detail/sections/autoscaling/AutoscalingSection';

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
                      action: <KServiceHeaderActions kservice={resource} />,
                    },
                    {
                      id: 'knative-kservice-logs',
                      action: <KServiceLogsHeaderButton kservice={resource} />,
                    },
                    {
                      id: 'knative.kservice-view-yaml',
                      action: <KServiceViewYamlHeaderButton kservice={resource} />,
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
                      section: <TrafficSection kservice={item} />,
                    },
                    {
                      id: 'knative.kservice-networking',
                      section: <NetworkingSection kservice={item} />,
                    },
                    {
                      id: 'knative.kservice-autoscaling',
                      section: <AutoscalingSection kservice={item} />,
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
