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
import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { NodeClassDetailView } from './NodeClass/Details';
import { NodeClasses } from './NodeClass/List';
import { NodePoolDetailView } from './NodePool/Details';
import { NodePools } from './NodePool/List';

registerSidebarEntry({
  parent: null,
  name: 'karpenter.k8s',
  label: 'Karpenter',
  url: '/karpenter/ec2nodeclasses',
});

registerSidebarEntry({
  parent: 'karpenter.k8s',
  name: 'nodeclass',
  label: 'Node Class',
  url: '/karpenter/ec2nodeclasses',
});

registerRoute({
  path: '/karpenter/ec2nodeclasses',
  sidebar: 'nodeclass',
  component: NodeClasses,
  name: 'nodeclasses-list',
});

registerRoute({
  path: '/karpenter/details/ec2nodeclasses/:name',
  sidebar: 'nodeclass',
  component: NodeClassDetailView,
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
  component: NodePoolDetailView,
  name: 'nodepools-detail',
});
