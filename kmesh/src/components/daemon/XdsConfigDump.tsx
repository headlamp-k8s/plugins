/**
 * XdsConfigDump — xDS Config Dump viewer for the Kmesh daemon (kernel-native / ADS mode).
 *
 * Surfaces the three main xDS resource types from GET /debug/config_dump/kernel-native:
 *   • Clusters  — upstream service definitions (api/v2/cluster/cluster.pb.go)
 *   • Listeners — inbound/outbound listener configs (api/v2/listener/listener.pb.go)
 *   • Routes    — virtual-host and route-match rules (api/v2/route/route.pb.go)
 *
 * The daemon serialises these via protojson.Format() — so each array element is a
 * RAW proto object, with no versionInfo/lastUpdated envelope.
 *
 * The endpoint returns HTTP 400 when the daemon runs in dual-engine / workload mode.
 *
 * @see src/hooks/useDaemonRequest.ts  — useXdsClusters / useXdsListeners / useXdsRoutes
 * @see src/types/daemonApi.ts         — XdsCluster, XdsListener, XdsRouteConfiguration
 * @see src/utils/kmeshDaemonProxy.ts  — deduplication (one HTTP call for all three tabs)
 */

import {
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, CircularProgress, Tab, Tabs, Typography } from '@mui/material';
import { type ReactNode, useState } from 'react';
import { useXdsClusters, useXdsListeners, useXdsRoutes } from '../../hooks/useDaemonRequest';
import { useKmeshDaemonPods } from '../../hooks/useKmeshDaemonPods';
import type { XdsCluster, XdsListener, XdsRouteConfiguration } from '../../types/daemonApi';
import { KMESH_NAMESPACE } from '../../utils/kmeshDaemonApi';

const PAGE_TITLE = 'Kmesh xDS Config Dump';

// ---------------------------------------------------------------------------
// Helper — convert IPv4 stored as uint32 → "a.b.c.d"
// api/v2/core/address.pb.go stores the address as a raw uint32 (network byte order).
// ---------------------------------------------------------------------------

/**
 * Converts a uint32 IPv4 address (as emitted by protojson) to a dotted-decimal string.
 * Returns '-' when the value is absent.
 */
function formatIpv4Uint32(ipv4?: number): string {
  if (ipv4 === undefined || ipv4 === null) return '-';
  return [(ipv4 >>> 24) & 0xff, (ipv4 >>> 16) & 0xff, (ipv4 >>> 8) & 0xff, ipv4 & 0xff].join('.');
}

function renderApiStatus(apiStatus?: string): ReactNode {
  const s = apiStatus ?? '';
  return s ? <StatusLabel status={s === 'OK' ? 'success' : 'warning'}>{s}</StatusLabel> : '-';
}

// ---------------------------------------------------------------------------
// Tab content panels — each uses SimpleTable exactly like HealthDashboard
// ---------------------------------------------------------------------------

/**
 * Clusters tab — shows CDS dynamic cluster resources.
 *
 * Columns sourced from api/v2/cluster/cluster.pb.go:
 *   GetName(), GetConnectTimeout(), GetLbPolicy(), GetApiStatus()
 */
function ClustersPanel({ clusters }: { clusters: XdsCluster[] }) {
  return (
    <SimpleTable
      data={clusters}
      columns={[
        {
          label: 'Name',
          getter: (c: XdsCluster) => c.name ?? '-',
          sort: true,
        },
        {
          label: 'LB Policy',
          getter: (c: XdsCluster) => c.lbPolicy ?? '-',
          sort: true,
        },
        {
          label: 'Connect Timeout (s)',
          getter: (c: XdsCluster) => (c.connectTimeout !== undefined ? c.connectTimeout : '-'),
          sort: (c: XdsCluster) => c.connectTimeout ?? -1,
        },
        {
          label: 'API Status',
          getter: (c: XdsCluster) => renderApiStatus(c.apiStatus),
          sort: (c: XdsCluster) => c.apiStatus ?? '',
        },
      ]}
      emptyMessage="No dynamic cluster configs found."
    />
  );
}

/**
 * Listeners tab — shows LDS dynamic listener resources.
 *
 * Columns sourced from api/v2/listener/listener.pb.go and api/v2/core/address.pb.go:
 *   GetName(), GetAddress().GetIpv4(), GetAddress().GetPort(), GetFilterChains()
 */
function ListenersPanel({ listeners }: { listeners: XdsListener[] }) {
  return (
    <SimpleTable
      data={listeners}
      columns={[
        {
          label: 'Name',
          getter: (l: XdsListener) => l.name ?? '-',
          sort: true,
        },
        {
          label: 'Address',
          getter: (l: XdsListener) => {
            const ip = formatIpv4Uint32(l.address?.ipv4);
            const port = l.address?.port;
            return ip !== '-' && port !== undefined ? `${ip}:${port}` : '-';
          },
          sort: true,
        },
        {
          label: 'Filter Chains',
          getter: (l: XdsListener) => l.filterChains?.length ?? 0,
          sort: true,
        },
        {
          label: 'API Status',
          getter: (l: XdsListener) => renderApiStatus(l.apiStatus),
          sort: (l: XdsListener) => l.apiStatus ?? '',
        },
      ]}
      emptyMessage="No dynamic listener configs found."
    />
  );
}

/**
 * Routes tab — shows RDS dynamic route configurations.
 *
 * Columns sourced from api/v2/route/route.pb.go and route_components.pb.go:
 *   GetName(), GetVirtualHosts(), VirtualHost.GetRoutes()
 */
function RoutesPanel({ routes }: { routes: XdsRouteConfiguration[] }) {
  return (
    <SimpleTable
      data={routes}
      columns={[
        {
          label: 'Name',
          getter: (r: XdsRouteConfiguration) => r.name ?? '-',
          sort: true,
        },
        {
          label: 'Virtual Hosts',
          getter: (r: XdsRouteConfiguration) => r.virtualHosts?.length ?? 0,
          sort: true,
        },
        {
          label: 'Total Routes',
          getter: (r: XdsRouteConfiguration) =>
            (r.virtualHosts ?? []).reduce((sum, vh) => sum + (vh.routes?.length ?? 0), 0),
          sort: true,
        },
        {
          label: 'API Status',
          getter: (r: XdsRouteConfiguration) => renderApiStatus(r.apiStatus),
          sort: (r: XdsRouteConfiguration) => r.apiStatus ?? '',
        },
      ]}
      emptyMessage="No dynamic route configs found."
    />
  );
}

// ---------------------------------------------------------------------------
// Loading / error guard shared by all three tabs
// ---------------------------------------------------------------------------

interface XdsResourcePanelProps<T> {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: T[] | null;
  error: string | null;
  children: (data: T[]) => ReactNode;
}

/**
 * Renders a spinner while loading, a typed error on failure,
 * or delegates to the tab-specific content component on success.
 */
function XdsResourcePanel<T>({ status, data, error, children }: XdsResourcePanelProps<T>) {
  if (status === 'idle' || status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (status === 'error') {
    // HTTP 400 means the daemon is in workload mode — surface a clear message.
    const isModeMismatch = /\b400\b/.test(error ?? '') || /Bad Request/i.test(error ?? '');
    return (
      <Typography color="error" variant="body2" sx={{ p: 2 }}>
        {isModeMismatch
          ? 'The Kmesh daemon is running in dual-engine / workload mode. ' +
            'The xDS config dump is only available in kernel-native (ADS) mode.'
          : `Error fetching xDS config dump: ${error}`}
      </Typography>
    );
  }

  return <>{children(data ?? [])}</>;
}

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type XdsTab = 'clusters' | 'listeners' | 'routes';

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * xDS Config Dump viewer page for Kmesh.
 *
 * Displays a tabbed interface (Clusters / Listeners / Routes) backed by the
 * kernel-native config dump endpoint.  All three tabs share one HTTP round-trip
 * thanks to the deduplication layer in kmeshDaemonProxy.ts.
 */
export default function XdsConfigDump() {
  const [activeTab, setActiveTab] = useState<XdsTab>('clusters');

  const { readyPod, loading: podsLoading, error: podsError } = useKmeshDaemonPods();
  const podName = readyPod?.name ?? null;

  // All three hooks call the same endpoint; the dedup layer ensures
  // only one actual HTTP request is made regardless of tab switches.
  const clusters = useXdsClusters(KMESH_NAMESPACE, podName);
  const listeners = useXdsListeners(KMESH_NAMESPACE, podName);
  const routes = useXdsRoutes(KMESH_NAMESPACE, podName);

  if (podsLoading) {
    return (
      <SectionBox title={PAGE_TITLE}>
        <CircularProgress />
      </SectionBox>
    );
  }

  if (podsError) {
    return (
      <SectionBox title={PAGE_TITLE}>
        <Typography color="error">Error loading pods: {podsError}</Typography>
      </SectionBox>
    );
  }

  if (!readyPod) {
    return (
      <SectionBox title={PAGE_TITLE}>
        <Typography variant="body2" color="textSecondary">
          No Running+Ready Kmesh daemon pod found. Ensure the kmesh-daemon DaemonSet is healthy.
        </Typography>
      </SectionBox>
    );
  }

  /** Tab label with live count badge once data is loaded. */
  function tabLabel(id: XdsTab): string {
    if (id === 'clusters' && clusters.status === 'success')
      return `Clusters (${clusters.data?.length ?? 0})`;
    if (id === 'listeners' && listeners.status === 'success')
      return `Listeners (${listeners.data?.length ?? 0})`;
    if (id === 'routes' && routes.status === 'success')
      return `Routes (${routes.data?.length ?? 0})`;
    return id.charAt(0).toUpperCase() + id.slice(1);
  }

  return (
    <SectionBox title={PAGE_TITLE}>
      <Tabs
        value={activeTab}
        onChange={(_e, v: XdsTab) => setActiveTab(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}
      >
        <Tab value="clusters" label={tabLabel('clusters')} />
        <Tab value="listeners" label={tabLabel('listeners')} />
        <Tab value="routes" label={tabLabel('routes')} />
      </Tabs>

      {activeTab === 'clusters' && (
        <XdsResourcePanel<XdsCluster> {...clusters}>
          {data => <ClustersPanel clusters={data} />}
        </XdsResourcePanel>
      )}

      {activeTab === 'listeners' && (
        <XdsResourcePanel<XdsListener> {...listeners}>
          {data => <ListenersPanel listeners={data} />}
        </XdsResourcePanel>
      )}

      {activeTab === 'routes' && (
        <XdsResourcePanel<XdsRouteConfiguration> {...routes}>
          {data => <RoutesPanel routes={data} />}
        </XdsResourcePanel>
      )}
    </SectionBox>
  );
}
