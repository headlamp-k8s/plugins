/**
 * Detail view for a single KmeshNodeInfo resource.
 * Shows full IPsec security state for one node: SPI, addresses, Pod CIDRs, and boot ID.
 */
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  MainInfoSection,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Link as HeadlampLink } from '@kinvolk/headlamp-plugin/lib/components/common';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useParams } from 'react-router-dom';
import { useKmeshDaemonPods } from '../../hooks/useKmeshDaemonPods';
import { KmeshNodeInfo } from '../../resources/kmeshNodeInfo';

/** Related resources for a KmeshNodeInfo: the underlying Node and the kmesh-daemon Pod on it. */
function NodeInfoRelatedResources({ nodeName }: { nodeName: string }) {
  const [node] = K8s.ResourceClasses.Node.useGet(nodeName);
  const { pods: daemonPods } = useKmeshDaemonPods();
  const daemonPod = daemonPods.find(p => p.nodeName === nodeName) ?? null;
  const [daemonPodObject] = K8s.ResourceClasses.Pod.useGet(
    daemonPod?.name ?? '',
    daemonPod?.namespace ?? ''
  );

  return (
    <SectionBox title="Related Resources">
      <SimpleTable
        data={[
          { label: 'Node', resources: node ? [node] : [] },
          { label: 'Kmesh Daemon Pod', resources: daemonPodObject ? [daemonPodObject] : [] },
        ]}
        columns={[
          {
            label: 'Resource Type',
            getter: (row: { label: string; resources: any[] }) => row.label,
          },
          {
            label: 'Resource',
            getter: (row: { label: string; resources: any[] }) =>
              row.resources.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {row.resources.map(resource => (
                    <HeadlampLink key={resource.metadata.uid} kubeObject={resource}>
                      {resource.getName()}
                    </HeadlampLink>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Not found
                </Typography>
              ),
          },
        ]}
      />
    </SectionBox>
  );
}

/**
 * Detail view for a single KmeshNodeInfo resource.
 */
export default function KmeshNodeInfoDetail() {
  const { namespace, name } = useParams<{ namespace?: string; name?: string }>();

  const [nodeInfos, error] = KmeshNodeInfo.useList({ namespace });
  const nodeInfo = nodeInfos?.find(n => n.getName() === name);

  // Compute SPI consensus across all nodes in same namespace (kmesh-system)
  const consensusSpi =
    nodeInfos && nodeInfos.length > 0
      ? (() => {
          const counts = new Map<number, number>();
          nodeInfos.forEach(n => counts.set(n.spi, (counts.get(n.spi) ?? 0) + 1));
          let maxCount = 0;
          let consensus = nodeInfos[0].spi;
          counts.forEach((count, spi) => {
            if (count > maxCount) {
              maxCount = count;
              consensus = spi;
            }
          });
          return consensus;
        })()
      : null;

  if (error) {
    return <Typography color="error">Error: {String(error)}</Typography>;
  }

  if (!nodeInfos) {
    return <CircularProgress />;
  }

  if (!nodeInfo) {
    return (
      <Typography color="error">
        KmeshNodeInfo "{name}" not found in namespace "{namespace}".
      </Typography>
    );
  }

  const isStale = consensusSpi !== null && nodeInfo.spi !== consensusSpi;

  const tableData = [
    {
      name: 'SPI (Key Version)',
      value: (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StatusLabel status={isStale ? 'error' : 'success'}>v{nodeInfo.spi}</StatusLabel>
          {isStale ? (
            <Typography variant="caption" color="error">
              ⚠ Stale — cluster consensus is v{consensusSpi}
            </Typography>
          ) : (
            <Typography variant="caption" color="success.main">
              ✅ In sync with cluster
            </Typography>
          )}
        </Box>
      ),
    },
    {
      name: 'Boot ID',
      value: (
        <Tooltip
          title="Changes on every node reboot, triggering IPsec key rotation"
          placement="top"
        >
          <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
            {nodeInfo.bootID || '—'}
          </Typography>
        </Tooltip>
      ),
    },
    {
      name: 'Node IP Addresses',
      value:
        nodeInfo.addresses.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {nodeInfo.addresses.map(addr => (
              <Chip key={addr} label={addr} size="small" variant="outlined" />
            ))}
          </Box>
        ) : (
          'None'
        ),
    },
    {
      name: 'Pod CIDRs',
      value:
        nodeInfo.podCIDRS.length > 0 ? (
          <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
            {nodeInfo.podCIDRS.map(cidr => (
              <Chip key={cidr} label={cidr} size="small" color="info" variant="outlined" />
            ))}
          </Box>
        ) : (
          'None'
        ),
    },
  ];

  return (
    <Box>
      <MainInfoSection
        resource={nodeInfo}
        extraInfo={[
          {
            name: 'SPI (Key Version)',
            value: `v${nodeInfo.spi}`,
          },
          {
            name: 'Boot ID',
            value: nodeInfo.bootID,
          },
        ]}
      />

      {/* SPI health alert */}
      {isStale && (
        <Alert severity="error" sx={{ mx: 2, mb: 2 }}>
          <strong>Stale IPsec Key Detected</strong> — This node&apos;s SPI (v{nodeInfo.spi}) does
          not match the cluster consensus (v{consensusSpi}). IPsec tunnels from this node to other
          nodes will fail. The Kmesh IPsec controller should automatically rotate keys on next
          reconcile or node event.
        </Alert>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" sx={{ mb: 1, px: 2 }}>
          IPsec Security Details
        </Typography>
        <SimpleTable
          data={tableData}
          columns={[
            {
              label: 'Property',
              getter: (row: any) => (
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  {row.name}
                </Typography>
              ),
            },
            {
              label: 'Value',
              getter: (row: any) => row.value,
            },
          ]}
        />
      </Box>

      <Box sx={{ mt: 2 }}>
        <NodeInfoRelatedResources nodeName={nodeInfo.getName()} />
      </Box>
    </Box>
  );
}
