import { MainInfoSection } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Waypoint } from '../../resources/waypoint';
import { kmeshRoutePaths } from '../../utils/kmeshRoutes';

/**
 * Props for the Waypoint Detail view component.
 *
 * @see https://kmesh.net/docs/architecture/#waypoint
 * @see https://kmesh.net/docs/application-layer/install_waypoint#install-waypoint
 * @see https://kmesh.net/docs/kmeshctl/kmeshctl_waypoint#kmeshctl-waypoint
 */
interface WaypointDetailProps {
  /** The name of the waypoint resource */
  name?: string;
  /** The namespace where the waypoint is deployed */
  namespace?: string;
  /** The cluster ID the waypoint belongs to */
  cluster?: string;
}

const MISSING_PARAMS_ERROR = new Error(
  `Waypoint route params missing. Expected route: ${kmeshRoutePaths.waypointDetail}`
);

export default function WaypointDetail(props: WaypointDetailProps) {
  const params = useParams<{ namespace?: string; name?: string }>();
  const name = props.name ?? params.name;
  const namespace = props.namespace ?? params.namespace;
  const cluster = props.cluster;

  if (!name || !namespace) {
    return (
      <MainInfoSection
        resource={null}
        title="Waypoint Details"
        error={MISSING_PARAMS_ERROR}
        backLink={kmeshRoutePaths.waypointsList}
      />
    );
  }

  return <WaypointDetailContent name={name} namespace={namespace} cluster={cluster} />;
}

function WaypointDetailContent({
  name,
  namespace,
  cluster,
}: {
  name: string;
  namespace: string;
  cluster?: string;
}) {
  const [waypoint, error] = Waypoint.useGet(name, namespace, { cluster });

  const extraInfo = useMemo(
    () => [
      {
        name: 'Gateway Class',
        value: waypoint?.spec?.gatewayClassName ?? '-',
      },
      {
        name: 'Image',
        value: waypoint?.image ?? '-',
      },
      {
        name: 'Current Status',
        value: waypoint?.currentStatus ?? '-',
      },
    ],
    [waypoint]
  );

  if (waypoint === null && !error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={4} minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <MainInfoSection
      resource={waypoint}
      error={error}
      title="Waypoint Details"
      backLink={kmeshRoutePaths.waypointsList}
      extraInfo={extraInfo}
    />
  );
}
