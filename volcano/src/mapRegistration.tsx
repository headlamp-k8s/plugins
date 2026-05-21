import { Icon } from '@iconify/react';
import {
  registerKindIcon,
  registerKubeObjectGlance,
  registerMapSource,
} from '@kinvolk/headlamp-plugin/lib';
import { QueueGlance } from './components/map/QueueGlance';
import { volcanoSource } from './mapView';
import { volcanoJobApiGroup, volcanoSchedulingApiGroup } from './utils/volcanoApi';
import { volcanoIconColor, volcanoIconName } from './volcanoIcon';

const volcanoKindIcon = {
  icon: <Icon icon={volcanoIconName} width="70%" height="70%" />,
  color: volcanoIconColor,
};

export function registerVolcanoMapExtensions() {
  registerMapSource(volcanoSource);
  registerKubeObjectGlance({ id: 'volcano-queue-glance', component: QueueGlance });

  registerKindIcon('Job', volcanoKindIcon, volcanoJobApiGroup);
  registerKindIcon('Queue', volcanoKindIcon, volcanoSchedulingApiGroup);
  registerKindIcon('PodGroup', volcanoKindIcon, volcanoSchedulingApiGroup);
}
