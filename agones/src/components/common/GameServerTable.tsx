import React from 'react';

import { Link } from '@kinvolk/headlamp-plugin/lib/components/common';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { GameServer } from '../../resources';

interface Props {
  gameServers: GameServer[];
}

export function GameServerTable({ gameServers }: Props) {
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>State</TableCell>
          <TableCell>Address</TableCell>
          <TableCell>Ports</TableCell>
          <TableCell>Node</TableCell>
        </TableRow>
      </TableHead>

      <TableBody>
        {gameServers.map(gs => (
          <TableRow key={gs.metadata.uid}>
            <TableCell>
              <Link kubeObject={gs}>
                {gs.metadata.name}
              </Link>
            </TableCell>

            <TableCell>{gs.state}</TableCell>

            <TableCell>{gs.address || '—'}</TableCell>

            <TableCell>{gs.ports || '—'}</TableCell>

            <TableCell>{gs.nodeName || '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}