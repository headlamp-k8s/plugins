import React from 'react';

import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';

import { GameServerSet } from '../../resources';

export function GameServerSetList() {
  return (
    <ResourceListView
      title="GameServerSets"
      resourceClass={GameServerSet}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getter: item => item.metadata?.name,
        },
        {
          id: 'namespace',
          label: 'Namespace',
          getter: item => item.metadata?.namespace,
        },
        {
          id: 'replicas',
          label: 'Replicas',
          getter: item => item.replicas,
        },
        {
          id: 'ready',
          label: 'Ready',
          getter: item => item.readyReplicas,
        },
      ]}
    />
  );
}