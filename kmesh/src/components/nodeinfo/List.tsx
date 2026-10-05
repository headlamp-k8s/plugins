/**
 * List view for KmeshNodeInfo CRDs.
 * Shows per-node IPsec security state with SPI consistency check.
 * An SPI mismatch across nodes means IPsec key rotation is broken on that node.
 */
import {
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { KmeshNodeInfo } from '../../resources/kmeshNodeInfo';

/**
 * Derives the cluster-wide consensus SPI by finding the most common value.
 * This is used to identify nodes whose SPI key is stale (out of sync).
 */
function getConsensusSpi(nodes: KmeshNodeInfo[]): number | null {
  if (nodes.length === 0) return null;
  const counts = new Map<number, number>();
  nodes.forEach(n => {
    const spi = n.spi;
    counts.set(spi, (counts.get(spi) ?? 0) + 1);
  });
  let maxCount = 0;
  let consensus = nodes[0].spi;
  counts.forEach((count, spi) => {
    if (count > maxCount) {
      maxCount = count;
      consensus = spi;
    }
  });
  return consensus;
}

/**
 * List view for KmeshNodeInfo resources showing per-node IPsec state.
 */
export default function KmeshNodeInfoList() {
  const [nodeInfos, error] = KmeshNodeInfo.useList();

  if (error) {
    return (
      <SectionBox title="Node Security (IPsec)">
        <Typography color="error">Error loading KmeshNodeInfo: {String(error)}</Typography>
      </SectionBox>
    );
  }

  if (!nodeInfos) {
    return (
      <SectionBox title="Node Security (IPsec)">
        <CircularProgress />
      </SectionBox>
    );
  }

  // No nodes using IPsec (feature not enabled or no nodes reporting)
  if (nodeInfos.length === 0) {
    return (
      <SectionBox title="Node Security (IPsec)">
        <Typography color="text.secondary">
          No KmeshNodeInfo resources found. IPsec encryption may not be enabled in this cluster.
        </Typography>
      </SectionBox>
    );
  }

  const consensusSpi = getConsensusSpi(nodeInfos);
  const stalNodes = nodeInfos.filter(n => n.spi !== consensusSpi);
  const allInSync = stalNodes.length === 0;

  return (
    <Box>
      {/* Cluster-wide IPsec health banner */}
      <Alert severity={allInSync ? 'success' : 'error'} sx={{ mb: 2 }}>
        <AlertTitle>
          {allInSync
            ? `IPsec Cluster SPI: v${consensusSpi} — All nodes in sync ✅`
            : `⚠️ IPsec SPI Mismatch Detected — Cluster consensus: v${consensusSpi}`}
        </AlertTitle>
        {!allInSync && (
          <>
            <strong>
              {stalNodes.length} node(s) have stale SPI keys:{' '}
              {stalNodes.map(n => n.getName()).join(', ')}
            </strong>
            <br />
            These nodes cannot establish secure IPsec tunnels with the rest of the cluster. A key
            rotation may be in progress, or the Kmesh IPsec controller may have failed on those
            nodes.
          </>
        )}
      </Alert>

      <SectionBox title="Node Security (IPsec)">
        <SimpleTable
          data={nodeInfos}
          columns={[
            {
              label: 'Node Name',
              getter: (node: KmeshNodeInfo) => node.getName(),
              sort: true,
            },
            {
              label: 'SPI (Key Version)',
              getter: (node: KmeshNodeInfo) => {
                const isStale = node.spi !== consensusSpi;
                return (
                  <StatusLabel status={isStale ? 'error' : 'success'}>
                    {`v${node.spi}`}
                    {isStale && ' ⚠ Stale'}
                  </StatusLabel>
                );
              },
              sort: (node: KmeshNodeInfo) => node.spi,
            },
            {
              label: 'IP Addresses',
              getter: (node: KmeshNodeInfo) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {node.addresses.map(addr => (
                    <Chip key={addr} label={addr} size="small" variant="outlined" />
                  ))}
                </Box>
              ),
            },
            {
              label: 'Pod CIDRs',
              getter: (node: KmeshNodeInfo) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {node.podCIDRS.map(cidr => (
                    <Chip key={cidr} label={cidr} size="small" color="info" variant="outlined" />
                  ))}
                </Box>
              ),
            },
            {
              label: 'Boot ID',
              getter: (node: KmeshNodeInfo) => (
                <Tooltip title={node.bootID} placement="top">
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '0.75rem',
                      maxWidth: 160,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {node.bootID}
                  </Typography>
                </Tooltip>
              ),
            },
          ]}
          emptyMessage="No KmeshNodeInfo resources found."
        />
      </SectionBox>
    </Box>
  );
}
