import React from 'react';
import { Router } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { GameServer } from '../../resources';

export function GameServerList() {
  return (
    <ResourceListView
      title="GameServers"
      resourceClass={GameServer}
      columns={[
        {
          id: 'name',
          label: 'Name',
          getter: (item: GameServer) => {
            const url = Router.createRouteURL('agones-gameserver', {
              namespace: item.metadata?.namespace!,
              name: item.metadata?.name!,
            });

            return (
              <a href={url}>
                {item.metadata?.name}
              </a>
            );
          },
        },

        {
          id: 'namespace',
          label: 'Namespace',
          getter: (item: GameServer) => item.metadata?.namespace,
        },

        {
          id: 'fleet',
          label: 'Fleet',
          getter: (item: GameServer) => {
            const fleet = item.metadata?.labels?.['agones.dev/fleet'];

            if (!fleet) {
              return '—';
            }

            const url = Router.createRouteURL('agones-fleet', {
              namespace: item.metadata?.namespace!,
              name: fleet,
            });

            return (
              <a href={url}>
                {fleet}
              </a>
            );
          },
        },

        {
          id: 'state',
          label: 'State',
          getter: (item: GameServer) => item.state,
        },

        {
          id: 'address',
          label: 'Address',
          getter: (item: GameServer) => item.address,
        },

        {
          id: 'ports',
          label: 'Ports',
          getter: (item: GameServer) => item.ports,
        },

        {
          id: 'node',
          label: 'Node',
          getter: (item: GameServer) => item.nodeName,
        },
      ]}
    />
  );
}