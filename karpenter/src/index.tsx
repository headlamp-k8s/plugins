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
import { addIcon } from '@iconify/react';
import { Icon } from '@iconify/react';
import {
  registerKindIcon,
  registerMapSource,
  registerRoute,
  registerSidebarEntry,
} from '@kinvolk/headlamp-plugin/lib';
import { karpenterSource } from './mapView';
import { NodeClassDetailView } from './NodeClass/Details';
import { NodeClasses } from './NodeClass/List';
import { NodePoolDetailView } from './NodePool/Details';
import { NodePools } from './NodePool/List';
import { PendingPods } from './PendingPods';
import { ScalingDetailView } from './Scaling/Details';
import { ScalingView } from './Scaling/List';

addIcon('simple-icons:karpenter', {
  body: `<svg viewBox="0 0 500 443" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
    <path fill="currentColor" d="M237.704918.0C314.662629.0 377.04918 62.3865513 377.04918 139.344262L377.049 336.352 442.622951 336.351852C474.31142 336.351852 5e2 362.040432 5e2 393.728901V443h-7.546066c-18.225271.0-33.094961-14.592764-33.437541-32.814815V401.960534L459.013099 401.553891C458.795948 388.160675 447.871194 377.37037 434.42623 377.37037H106.557377C47.7073627 377.37037.0 329.663008.0 270.812993L-100611761e-22 139.344262C-100611761e-22 62.3865513 62.3865513.0 139.344262.0zm-8.196721 41.0185185H147.540984L145.778863 41.0327942C87.7415928 41.97378 40.9836066 89.3143814 40.9836066 147.575896V270.778081L40.9923916 271.862464C41.5714598 307.577706 70.7041376 336.351852 106.557377 336.351852H270.491803c36.215394.0 65.573771-29.358377 65.573771-65.573771V147.575896L336.051298 145.813774C335.110312 87.7765047 287.769711 41.0185185 229.508197 41.0185185zM147.868852 106.648148C157.213115 106.648148 164.590164 114.277593 164.590164 123.875926v49.960555l56.803279-58.574444C228.770492 108.370926 238.852459 107.878704 245.983607 114.523704V114.769815C252.868852 121.168704 252.377049 131.751481 244.754098 138.642593l-42.04918 43.315555 48.934426 69.895556C257.540984 260.467593 255.819672 271.296481 247.95082 276.464815 239.344262 281.387037 229.508197 278.679815 223.606557 270.065926l-44.016393-64.481111-15 15.751111v40.362222c0 9.84444500000001-7.377049 17.227778-16.721312 17.227778C138.52459 278.925926 131.147541 271.542593 131.147541 261.698148V123.875926c0-9.59833300000001 7.377049-17.227778 16.721311-17.227778z" />
  </svg>`,
  width: 24,
  height: 24,
});

registerSidebarEntry({
  parent: null,
  name: 'karpenter.k8s',
  icon: 'simple-icons:karpenter',
  label: 'Karpenter',
  url: '/karpenter/nodeclasses',
});

registerSidebarEntry({
  parent: 'karpenter.k8s',
  name: 'nodeclass',
  label: 'Node Class',
  url: '/karpenter/nodeclasses',
});

registerRoute({
  path: '/karpenter/nodeclasses',
  sidebar: 'nodeclass',
  component: NodeClasses,
  name: 'nodeclasses-list',
});

registerRoute({
  path: '/karpenter/details/nodeclasses/:name',
  sidebar: 'nodeclass',
  component: () => <NodeClassDetailView />,
  name: 'nodeclasses-detail',
});

registerSidebarEntry({
  parent: 'karpenter.k8s',
  name: 'nodepool',
  label: 'Node Pool',
  url: '/karpenter/nodepools',
});

registerRoute({
  path: '/karpenter/nodepools',
  sidebar: 'nodepool',
  component: NodePools,
  name: 'nodepools-list',
});

registerRoute({
  path: '/karpenter/details/nodepools/:name',
  sidebar: 'nodepool',
  component: () => <NodePoolDetailView />,
  name: 'nodepools-detail',
});

registerSidebarEntry({
  parent: 'karpenter.k8s',
  name: 'pending-pods',
  label: 'Pending Pods',
  url: '/karpenter/pending-pods',
});

registerRoute({
  path: '/karpenter/pending-pods',
  sidebar: 'pending-pods',
  component: PendingPods,
  name: 'pending-pods-view',
});

registerSidebarEntry({
  parent: 'karpenter.k8s',
  name: 'scaling-view',
  label: 'Scaling View',
  url: '/karpenter/scaling',
});

registerRoute({
  path: '/karpenter/scaling',
  sidebar: 'scaling-view',
  component: ScalingView,
  name: 'scaling-view',
});

registerRoute({
  path: '/karpenter/details/scaling/:name',
  sidebar: 'scaling-view',
  component: () => <ScalingDetailView />,
  name: 'nodeclaims-detail',
});

registerMapSource(karpenterSource);

registerKindIcon('NodePool', {
  icon: <Icon icon="mdi:pool" width="70%" height="70%" />,
  color: 'rgb(50, 108, 229)',
});

registerKindIcon('NodeClass', {
  icon: <Icon icon="mdi:file-cog" width="70%" height="70%" />,
  color: 'rgb(50, 108, 229)',
});

registerKindIcon('EC2NodeClass', {
  icon: <Icon icon="mdi:file-cog" width="70%" height="70%" />,
  color: 'rgb(50, 108, 229)',
});

registerKindIcon('AKSNodeClass', {
  icon: <Icon icon="mdi:file-cog" width="70%" height="70%" />,
  color: 'rgb(0, 120, 215)',
});

registerKindIcon('NodeClaim', {
  icon: <Icon icon="mdi:hand-extended" width="70%" height="70%" />,
  color: 'rgb(50, 108, 229)',
});
