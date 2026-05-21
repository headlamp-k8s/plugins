import React from 'react';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';

import { Fleet } from '../../resources';

export function FleetList() {
  return (
    <ResourceListView
      title="Fleets"
      resourceClass={Fleet}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getter: (item: Fleet) => item.name,
        },
        {
          id: 'namespace',
          label: 'Namespace',
          getter: (item: Fleet) => item.namespace,
        },
        {
          id: 'replicas',
          label: 'Replicas',
          getter: (item: Fleet) => item.replicas,
        },
        {
          id: 'ready',
          label: 'Ready',
          getter: (item: Fleet) => item.readyReplicas,
        },
        {
          id: 'allocated',
          label: 'Allocated',
          getter: (item: Fleet) => item.allocatedReplicas,
        },
      ]}
    />
  );
}