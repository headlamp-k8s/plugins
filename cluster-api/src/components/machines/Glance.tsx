import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/system';
import { getMachineConditions, getMachineStatus, Machine } from '../../resources/machine';
import { getPhaseStatus } from './List';

export function MachineGlance({ node }: { node: { kubeObject?: Machine } }) {
  const kubeObject = node?.kubeObject;
  if (!kubeObject || kubeObject.kind !== Machine.kind || !kubeObject.jsonData) {
    return null;
  }

  const status = getMachineStatus(kubeObject.jsonData);
  const conditions = getMachineConditions(kubeObject.jsonData);
  if (!status) {
    return null;
  }

  const clusterName = kubeObject.jsonData.spec?.clusterName || 'Unknown';
  const readyCondition = conditions?.find(
    (c: { type?: string; status?: string }) => c.type === 'Ready'
  );
  const isReady = readyCondition?.status === 'True';
  const readiness = isReady ? 'Ready' : 'Not Ready';

  const internalIP = status.addresses?.find(addr => addr.type === 'InternalIP')?.address || 'N/A';
  const externalIP = status.addresses?.find(addr => addr.type === 'ExternalIP')?.address || 'N/A';

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="machine-glance">
      <StatusLabel status="">{`Cluster: ${clusterName}`}</StatusLabel>
      <StatusLabel status={getPhaseStatus(status?.phase ?? '')}>{`${
        status?.phase ?? 'Unknown'
      }`}</StatusLabel>
      <StatusLabel status={isReady ? 'success' : 'error'}>{`Readiness: ${readiness}`}</StatusLabel>
      <StatusLabel status="">{`Internal IP: ${internalIP}`}</StatusLabel>
      <StatusLabel status="">{`External IP: ${externalIP}`}</StatusLabel>
    </Box>
  );
}
