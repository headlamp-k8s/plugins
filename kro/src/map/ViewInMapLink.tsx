import { Icon } from '@iconify/react';
import { Router } from '@kinvolk/headlamp-plugin/lib';
import { Button } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

/**
 * Link to Headlamp's global Map view focused on one node. The kro map
 * source registers RGDs, instances, and kro-managed resources by uid,
 * so any of their uids can be targeted with the map's ?node= parameter.
 */
export default function ViewInMapLink(props: { nodeId: string; label?: string }) {
  const { nodeId, label } = props;
  return (
    <Button
      component={RouterLink}
      to={`${Router.createRouteURL('map')}?node=${encodeURIComponent(nodeId)}`}
      startIcon={<Icon icon="mdi:map" />}
      size="small"
      color="primary"
    >
      {label ?? 'View in Map'}
    </Button>
  );
}
