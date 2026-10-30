import { ApiProxy, K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import {
  CheckState,
  CILIUM_CRD,
  ErrorLike,
  getCiliumRow,
  getRelayRow,
  HUBBLE_RELAY_SERVICE,
  StatusRow,
} from './statusRows';

/** How often the hubble-relay lookup runs again, so the page notices Relay being installed or removed. */
export const RELAY_REFRESH_MS = 5000;

const stateLabels: Record<
  CheckState,
  { status: 'success' | 'error' | 'warning' | ''; text: string }
> = {
  found: { status: 'success', text: 'Found' },
  missing: { status: 'error', text: 'Not found' },
  unknown: { status: 'warning', text: 'Unknown' },
  checking: { status: '', text: 'Checking' },
};

/**
 * Looks up hubble-relay Services in every namespace of one cluster. This is a direct
 * cluster-wide request on purpose: Service.useList only asks the namespaces Headlamp is
 * allowed to show, so with allowed namespaces set, a Relay in kube-system would look
 * missing instead of unknown.
 *
 * @param cluster - The cluster to look in.
 * @returns The Services found (null until the first answer) and the last error, if any.
 */
function useRelayServices(cluster: string) {
  const [result, setResult] = useState<{
    services: { namespace: string }[] | null;
    error: ErrorLike | null;
  }>({ services: null, error: null });

  useEffect(() => {
    let cancelled = false;
    // On a slow cluster a request can take longer than the refresh interval. Skip a refresh
    // while one is still running, so an older answer can't arrive last and replace a newer one.
    let loading = false;
    setResult({ services: null, error: null });

    async function load() {
      if (loading) {
        return;
      }
      loading = true;
      try {
        const list = await ApiProxy.clusterRequest(
          '/api/v1/services',
          { cluster },
          { fieldSelector: `metadata.name=${HUBBLE_RELAY_SERVICE}` }
        );
        if (!cancelled) {
          const items: { metadata?: { namespace?: string } }[] = list?.items ?? [];
          setResult({
            services: items.map(item => ({ namespace: item.metadata?.namespace ?? '' })),
            error: null,
          });
        }
      } catch (err) {
        if (!cancelled) {
          setResult({ services: null, error: { status: (err as ErrorLike)?.status } });
        }
      } finally {
        loading = false;
      }
    }

    load();
    const timer = setInterval(load, RELAY_REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [cluster]);

  return result;
}

/**
 * The status table for one cluster.
 *
 * @param props.cluster - The cluster to check.
 * @param props.showName - Whether to show the cluster name, when more than one is selected.
 * @returns The table.
 */
function ClusterStatus(props: { cluster: string; showName: boolean }) {
  const { cluster, showName } = props;
  // CRDs aren't namespaced, so this list isn't limited by allowed namespaces. It's watched,
  // so the row changes as soon as Cilium is installed or removed.
  const [crds, crdsError] = K8s.ResourceClasses.CustomResourceDefinition.useList({
    cluster,
    fieldSelector: `metadata.name=${CILIUM_CRD}`,
  });
  const relay = useRelayServices(cluster);

  const rows = [getCiliumRow(crds, crdsError), getRelayRow(relay.services, relay.error)];

  return (
    <Box component="section" aria-label={`Status of ${cluster}`} sx={{ mb: 2 }}>
      {showName && (
        <Typography variant="h6" component="h2" sx={{ mb: 1 }}>
          {cluster}
        </Typography>
      )}
      <SimpleTable
        columns={[
          { label: 'Component', getter: (row: StatusRow) => row.component },
          {
            label: 'Status',
            getter: (row: StatusRow) => (
              <StatusLabel status={stateLabels[row.state].status}>
                {stateLabels[row.state].text}
              </StatusLabel>
            ),
          },
          { label: 'Details', getter: (row: StatusRow) => row.details },
        ]}
        data={rows}
      />
    </Box>
  );
}

/**
 * Status page: shows whether each selected cluster has what this plugin reads from,
 * Cilium and Hubble Relay. Each cluster gets its own table, so components found in
 * different clusters are never shown as one.
 *
 * @returns The status view.
 */
export default function HubbleStatus() {
  const clusters = K8s.useSelectedClusters();

  return (
    <SectionBox title="Hubble">
      <Typography sx={{ mb: 2 }}>
        Hubble records the network traffic between pods in a Cilium cluster. The checks below show
        what each selected cluster has.
      </Typography>
      {clusters.map(cluster => (
        <ClusterStatus key={cluster} cluster={cluster} showName={clusters.length > 1} />
      ))}
    </SectionBox>
  );
}
