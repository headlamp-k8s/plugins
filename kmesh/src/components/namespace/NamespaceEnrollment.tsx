import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Typography } from '@mui/material';

/**
 * Renders the Kmesh Enrollment status section in the Namespace detail view.
 * It checks for the `istio.io/dataplane-mode` label on the Namespace resource.
 */
export default function NamespaceEnrollment(props: {
  resource: InstanceType<typeof K8s.ResourceClasses.Namespace>;
}) {
  const { resource } = props;

  // We only want to render this for Namespaces
  if (!resource || resource.kind !== 'Namespace') {
    return null;
  }

  const labels = resource.metadata?.labels || {};
  const dataplaneMode = labels['istio.io/dataplane-mode'];
  const useWaypoint = labels['istio.io/use-waypoint'];

  const isEnrolled = dataplaneMode === 'Kmesh';

  return (
    <SectionBox title="Kmesh Enrollment">
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ width: '120px', fontWeight: 'bold' }}>
            Dataplane Mode:
          </Typography>
          <StatusLabel status={isEnrolled ? 'success' : ''}>
            {isEnrolled ? 'Kmesh' : 'Not Enrolled'}
          </StatusLabel>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="body2" sx={{ width: '120px', fontWeight: 'bold' }}>
            Waypoint:
          </Typography>
          <Typography variant="body2">
            {useWaypoint ? (
              useWaypoint
            ) : (
              <span style={{ color: 'text.secondary' }}>None assigned</span>
            )}
          </Typography>
        </Box>
      </Box>
    </SectionBox>
  );
}
