import { Icon } from '@iconify/react';
import { Activity } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import MuiLink from '@mui/material/Link';
import { KMESH_WAYPOINT_GATEWAY_CLASS, Waypoint } from '../../resources/waypoint';
import WaypointDetail from './Detail';

/**
 * Renders the list view for KMesh Waypoints.
 * Filters Kubernetes Gateway resources to only show those managed by KMesh.
 */
export default function WaypointList() {
  return (
    <ResourceListView
      title="KMesh Waypoints"
      resourceClass={Waypoint}
      filterFunction={(item: Waypoint) =>
        item.spec?.gatewayClassName === KMESH_WAYPOINT_GATEWAY_CLASS
      }
      columns={[
        {
          id: 'waypoint-name',
          label: 'Name',
          getValue: (item: Waypoint) => item.metadata.name,
          render: (item: Waypoint) => (
            <MuiLink
              component="button"
              type="button"
              variant="body2"
              underline="hover"
              onClick={() => {
                Activity.launch({
                  id: `kmesh-waypoint-${item.cluster || 'default'}-${item.metadata.namespace}-${
                    item.metadata.name
                  }`,
                  location: 'split-right',
                  temporary: true,
                  cluster: item.cluster,
                  hideTitleInHeader: true,
                  title: item.metadata.name,
                  icon: <Icon icon="mdi:vector-triangle" width="20" height="20" />,
                  content: (
                    <WaypointDetail
                      name={item.metadata.name}
                      namespace={item.metadata.namespace}
                      cluster={item.cluster}
                    />
                  ),
                });
              }}
            >
              {item.metadata.name}
            </MuiLink>
          ),
        },
        'namespace',
        {
          id: 'image',
          label: 'Image',
          getValue: (item: Waypoint) => item.image,
        },
        {
          id: 'status',
          label: 'Status',
          getValue: (item: Waypoint) => item.currentStatus,
        },
        'age',
      ]}
    />
  );
}
