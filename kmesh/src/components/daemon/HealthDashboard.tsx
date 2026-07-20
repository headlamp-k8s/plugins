/**
 * Provides a comprehensive UI dashboard for monitoring Kmesh Daemon pods.
 * It uses the Headlamp SimpleTable component to aggregate pod status and dynamically
 * fetches the daemon version directly from each pod using a local proxy hook.
 */
import {
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { CircularProgress, Typography } from '@mui/material';
import { useKmeshVersion } from '../../hooks/useDaemonRequest';
import { type KmeshDaemonPod, useKmeshDaemonPods } from '../../hooks/useKmeshDaemonPods';

/**
 * Renders an individual table cell displaying the daemon version for a given pod.
 * This component utilizes a hook to tunnel through the Kubernetes API server and
 * query the specific pod's `/version` endpoint securely.
 *
 * @param props - Component props containing the pod data
 * @param props.pod - The Kmesh Daemon pod to fetch the version for
 * @returns A React component rendering the version string or an error state
 */
function DaemonVersionCell({ pod }: { pod: KmeshDaemonPod }) {
  const versionState = useKmeshVersion(
    pod.namespace,
    pod.phase === 'Running' && pod.ready ? pod.name : null
  );

  if (pod.phase !== 'Running' || !pod.ready) {
    return (
      <Typography variant="body2" color="text.secondary">
        -
      </Typography>
    );
  }

  const { status, data: version, error } = versionState;

  if (status === 'loading') {
    return <CircularProgress size={16} />;
  }

  if (status === 'error') {
    return (
      <Typography color="error" variant="body2">
        Error: {error ?? 'Unknown error'}
      </Typography>
    );
  }

  if (version) {
    return (
      <Typography variant="body2">
        {version.gitVersion ?? version.version ?? 'unknown'} (
        {(version.gitCommit ?? version.gitRevision ?? '').substring(0, 7) || 'unknown'})
      </Typography>
    );
  }

  return (
    <Typography variant="body2" color="text.secondary">
      -
    </Typography>
  );
}

/**
 * The main Health Dashboard component for Kmesh.
 * This fetches all running Kmesh daemon pods in the cluster via the Kubernetes API
 * and visualizes their deployment state alongside their dynamically queried daemon metrics.
 *
 * @returns A React component containing a table of daemon pods
 */
export default function HealthDashboard() {
  const { pods, loading, error } = useKmeshDaemonPods();

  if (error) {
    return (
      <SectionBox title="Kmesh Daemon Health">
        <Typography color="error">Error loading pods: {error ?? 'Unknown error'}</Typography>
      </SectionBox>
    );
  }

  return (
    <SectionBox title="Kmesh Daemon Health">
      {loading ? (
        <CircularProgress />
      ) : (
        <SimpleTable
          data={pods}
          columns={[
            {
              label: 'Pod Name',
              getter: (pod: KmeshDaemonPod) => pod.name,
              sort: true,
            },
            {
              label: 'Node',
              getter: (pod: KmeshDaemonPod) => pod.nodeName,
              sort: true,
            },
            {
              label: 'IP',
              getter: (pod: KmeshDaemonPod) => pod.podIP,
              sort: true,
            },
            {
              label: 'Status',
              getter: (pod: KmeshDaemonPod) => {
                const displayStatus = pod.statusReason ?? pod.phase;
                return (
                  <StatusLabel status={pod.phase === 'Running' && pod.ready ? 'success' : 'error'}>
                    {`${displayStatus}${!pod.ready ? ' (Not Ready)' : ''}`}
                  </StatusLabel>
                );
              },
              sort: (pod: KmeshDaemonPod) => pod.statusReason ?? pod.phase,
            },
            {
              label: 'Daemon Version (Proxy)',
              getter: (pod: KmeshDaemonPod) => <DaemonVersionCell pod={pod} />,
              sort: false,
            },
          ]}
          emptyMessage="No kmesh-daemon pods found in the cluster."
        />
      )}
    </SectionBox>
  );
}
