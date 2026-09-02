import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';
import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { Box } from '@mui/system';
import { ClusterClass } from '../../resources/clusterclass';

export function ClusterClassGlance({ node }: { node: GraphNode }) {
  const { t } = useTranslation();
  const kubeObject = node?.kubeObject;
  if (!kubeObject || kubeObject.kind !== ClusterClass.kind || !kubeObject.jsonData) {
    return null;
  }

  const cc = kubeObject as ClusterClass;
  const spec = cc.jsonData?.spec as any;
  const infraRefName = cc.infrastructureRef?.name;
  const cpRefName = cc.controlPlaneRef?.name;

  const mdsCount = spec?.workers?.machineDeployments?.length || 0;
  const mpsCount = spec?.workers?.machinePools?.length || 0;

  return (
    <Box display="flex" gap={1} alignItems="center" mt={2} flexWrap="wrap" key="cc-glance">
      {infraRefName && (
        <StatusLabel status="">{t('Infra: {{name}}', { name: infraRefName })}</StatusLabel>
      )}
      {cpRefName && <StatusLabel status="">{t('CP: {{name}}', { name: cpRefName })}</StatusLabel>}
      <StatusLabel status="">{t('MDs: {{count}}', { count: mdsCount })}</StatusLabel>
      <StatusLabel status="">{t('MPs: {{count}}', { count: mpsCount })}</StatusLabel>
    </Box>
  );
}
