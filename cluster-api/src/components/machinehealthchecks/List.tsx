import { Link, Loader, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { MachineHealthCheck } from '../../resources/machinehealthcheck';
import { useCapiApiVersion } from '../../utils/capiVersion';

interface MachineHealthChecksListWithDataProps {
  MachineHealthCheckClass: typeof MachineHealthCheck;
}

/**
 * Data-fetching wrapper for the machine health check list.
 *
 * @param props - Component properties.
 * @param props.MachineHealthCheckClass - The MachineHealthCheck resource class bound to a specific API version.
 */
function MachineHealthChecksListWithData({
  MachineHealthCheckClass,
}: MachineHealthChecksListWithDataProps) {
  return (
    <ResourceListView
      title="Machine Health Checks"
      resourceClass={MachineHealthCheckClass}
      columns={[
        'name',
        'namespace',
        {
          id: 'cluster',
          label: 'Cluster',
          getValue: mhc => mhc.metadata?.labels?.['cluster.x-k8s.io/cluster-name'],
          render: mhc => (
            <Link
              routeName="capicluster"
              params={{
                name: mhc.metadata?.labels?.['cluster.x-k8s.io/cluster-name'],
                namespace: mhc.metadata?.namespace,
              }}
            >
              {mhc.metadata?.labels?.['cluster.x-k8s.io/cluster-name']}
            </Link>
          ),
        },
        {
          id: 'expectedMachines',
          label: 'Expected Machines',
          getValue: mhc => mhc.status?.expectedMachines,
        },
        {
          id: 'maxUnhealthy',
          label: 'Max Unhealthy',
          getValue: mhc => mhc.spec?.maxUnhealthy,
        },
        {
          id: 'currentHealthy',
          label: 'Current Healthy',
          getValue: mhc => mhc.status?.currentHealthy,
        },
        'age',
      ]}
    />
  );
}

/**
 * Main entry point for the MachineHealthChecks list view.
 * Detects the CAPI version and renders the list with the correct resource class.
 */
export function MachineHealthChecksList() {
  const version = useCapiApiVersion(MachineHealthCheck.crdName, 'v1beta1');
  const VersionedMachineHealthCheck = useMemo(
    () => (version ? MachineHealthCheck.withApiVersion(version) : MachineHealthCheck),
    [version]
  );
  if (!version) return <Loader title="Detecting MachineHealthCheck version" />;
  return <MachineHealthChecksListWithData MachineHealthCheckClass={VersionedMachineHealthCheck} />;
}
