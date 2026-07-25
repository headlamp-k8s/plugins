/**
 * EbpfMaps — live eBPF kernel data-plane viewer for the Kmesh daemon (dual-engine mode).
 *
 * Surfaces the five BPF maps from GET /debug/config_dump/bpf/dual-engine:
 *   • Backends         — pod IPs known to the kernel + their waypoints
 *   • Frontends        — kernel routing table (every IP → service or backend)
 *   • Services         — services with LB policy, ports, and endpoint counts
 *   • Endpoints        — per-priority backend assignment (locality-aware LB)
 *   • Workload Policies — active authz policy IDs applied per workload
 *
 * The endpoint returns HTTP 400 when the daemon runs in kernel-native / ADS mode.
 *
 * @see src/hooks/useDaemonRequest.ts  — useWorkloadBpfMaps
 * @see src/types/daemonApi.ts         — WorkloadBpfDump and BPF* value types
 * @see src/utils/kmeshDaemonProxy.ts  — deduplication layer (one HTTP call per pod)
 * @see src/components/daemon/XdsConfigDump.tsx — structural template this follows
 */

import {
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, CircularProgress, Tab, Tabs, Typography } from '@mui/material';
import { type ReactNode, useState } from 'react';
import { useWorkloadBpfMaps } from '../../hooks/useDaemonRequest';
import { useKmeshDaemonPods } from '../../hooks/useKmeshDaemonPods';
import type {
  BpfBackendValue,
  BpfEndpointValue,
  BpfFrontendValue,
  BpfServiceValue,
  BpfWorkloadPolicyValue,
} from '../../types/daemonApi';
import { KMESH_NAMESPACE } from '../../utils/kmeshDaemonApi';

const PAGE_TITLE = 'Kmesh eBPF Maps';

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** Render a dash when value is absent / empty. */
function dash(v: string | number | undefined | null): string {
  if (v === undefined || v === null || v === '') return '-';
  return String(v);
}

/** Format waypoint addr:port, or return '-' when absent. */
function formatWaypoint(addr?: string, port?: number): string {
  if (!addr || addr === '') return '-';
  return port !== undefined ? `${addr}:${port}` : addr;
}

/** Render a list of strings as inline Chips (max shown before truncating). */
function ChipList({ items, max = 3 }: { items: string[]; max?: number }) {
  if (!items || items.length === 0) return <Typography variant="body2">-</Typography>;
  const shown = items.slice(0, max);
  const rest = items.length - max;
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {shown.map((s, i) => (
        <Chip key={i} label={s} size="small" variant="outlined" />
      ))}
      {rest > 0 && <Chip label={`+${rest} more`} size="small" color="default" variant="outlined" />}
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Tab panels — one per BPF map type
// ---------------------------------------------------------------------------

/**
 * Backends tab — pod IPs and their service associations as seen by the kernel.
 *
 * Maps to KmBackend BPF map (pkg/controller/workload/bpfcache/backend.go):
 *   BackendValue { Ip, ServiceCount, Services[10], WaypointAddr, WaypointPort }
 */
function BackendsPanel({ backends }: { backends: BpfBackendValue[] }) {
  return (
    <SimpleTable
      data={backends}
      columns={[
        {
          label: 'Pod IP',
          getter: (b: BpfBackendValue) => dash(b.ip),
          sort: (b: BpfBackendValue) => b.ip ?? '',
        },
        {
          label: 'Services (#)',
          getter: (b: BpfBackendValue) => b.serviceCount ?? 0,
          sort: (b: BpfBackendValue) => b.serviceCount ?? 0,
        },
        {
          label: 'Service Names',
          getter: (b: BpfBackendValue) => <ChipList items={b.services ?? []} />,
        },
        {
          label: 'Waypoint',
          getter: (b: BpfBackendValue) => formatWaypoint(b.waypointAddr, b.waypointPort),
          sort: (b: BpfBackendValue) => b.waypointAddr ?? '',
        },
      ]}
      emptyMessage="No backend entries found in the BPF map."
    />
  );
}

/**
 * Frontends tab — the kernel's IP routing table (every VIP or pod IP → upstream ID).
 *
 * Maps to KmFrontend BPF map (pkg/controller/workload/bpfcache/frontend.go):
 *   FrontendKey { Ip [16]byte } → FrontendValue { UpstreamId uint32 }
 */
function FrontendsPanel({ frontends }: { frontends: BpfFrontendValue[] }) {
  return (
    <SimpleTable
      data={frontends}
      columns={[
        {
          label: 'Frontend IP',
          getter: (f: BpfFrontendValue) => dash(f.ip),
          sort: (f: BpfFrontendValue) => f.ip ?? '',
        },
        {
          label: 'Upstream ID (Service or Backend)',
          getter: (f: BpfFrontendValue) => dash(f.upstreamId),
          sort: (f: BpfFrontendValue) => f.upstreamId ?? '',
        },
      ]}
      emptyMessage="No frontend routing entries found in the BPF map."
    />
  );
}

/**
 * Services tab — services with LB policy, port mappings, and endpoint counts.
 *
 * Maps to KmService BPF map (pkg/controller/workload/bpfcache/service.go):
 *   ServiceValue { EndpointCount[7], LbPolicy, ServicePort[10], TargetPort[10],
 *                  WaypointAddr, WaypointPort }
 */
function ServicesPanel({ services }: { services: BpfServiceValue[] }) {
  return (
    <SimpleTable
      data={services}
      columns={[
        {
          label: '#',
          getter: (_: BpfServiceValue, idx: number) => idx + 1,
          sort: (_: BpfServiceValue, idx: number) => idx,
        },
        {
          label: 'LB Policy',
          getter: (s: BpfServiceValue) => (
            <StatusLabel status={s.lbPolicy === 'RANDOM' ? 'success' : 'info'}>
              {dash(s.lbPolicy)}
            </StatusLabel>
          ),
          sort: (s: BpfServiceValue) => s.lbPolicy ?? '',
        },
        {
          label: 'Service Port',
          getter: (s: BpfServiceValue) => dash(s.servicePort),
          sort: (s: BpfServiceValue) => Number(s.servicePort ?? 0),
        },
        {
          label: 'Target Port',
          getter: (s: BpfServiceValue) => dash(s.targetPort),
          sort: (s: BpfServiceValue) => Number(s.targetPort ?? 0),
        },
        {
          label: 'Endpoints',
          getter: (s: BpfServiceValue) => dash(s.endpointCount),
          sort: (s: BpfServiceValue) => Number(s.endpointCount ?? 0),
        },
        {
          label: 'Waypoint',
          getter: (s: BpfServiceValue) => formatWaypoint(s.waypointAddr, s.waypointPort),
          sort: (s: BpfServiceValue) => s.waypointAddr ?? '',
        },
      ]}
      emptyMessage="No service entries found in the BPF map."
    />
  );
}

/**
 * Endpoints tab — per-priority backend assignment, revealing locality-aware LB buckets.
 *
 * Maps to KmEndpoint BPF map (pkg/controller/workload/bpfcache/endpoint.go):
 *   EndpointKey { ServiceId, Prio, BackendIndex } → EndpointValue { BackendUid }
 *
 * Priority 0 = same node/zone (preferred). Priority 6 = cross-network (last resort).
 */
function EndpointsPanel({ endpoints }: { endpoints: BpfEndpointValue[] }) {
  return (
    <>
      <Typography variant="caption" color="text.secondary" sx={{ px: 1, pb: 1, display: 'block' }}>
        Priority 0 = same node/zone (preferred) → Priority 6 = cross-network (last resort). Lower
        priority index = higher preference.
      </Typography>
      <SimpleTable
        data={endpoints}
        columns={[
          {
            label: 'Priority',
            getter: (e: BpfEndpointValue) => e.priority ?? '-',
            sort: (e: BpfEndpointValue) => e.priority ?? 99,
          },
          {
            label: 'Service ID',
            getter: (e: BpfEndpointValue) => dash(e.serviceId),
            sort: (e: BpfEndpointValue) => e.serviceId ?? '',
          },
          {
            label: 'Backend Index',
            getter: (e: BpfEndpointValue) => e.backendIndex ?? '-',
            sort: (e: BpfEndpointValue) => e.backendIndex ?? 0,
          },
          {
            label: 'Backend UID',
            getter: (e: BpfEndpointValue) => dash(e.backendUid),
            sort: (e: BpfEndpointValue) => e.backendUid ?? '',
          },
        ]}
        emptyMessage="No endpoint entries found in the BPF map."
      />
    </>
  );
}

/**
 * Workload Policies tab — active authz policy IDs applied per workload in the kernel.
 *
 * Maps to KmWlpolicy BPF map (pkg/controller/workload/bpfcache/auth_policy.go):
 *   WorkloadPolicyKey { WorkloadId } → WorkloadPolicyValue { PolicyIds[4] }
 */
function WorkloadPoliciesPanel({ policies }: { policies: BpfWorkloadPolicyValue[] }) {
  return (
    <SimpleTable
      data={policies}
      columns={[
        {
          label: '#',
          getter: (_: BpfWorkloadPolicyValue, idx: number) => idx + 1,
          sort: (_: BpfWorkloadPolicyValue, idx: number) => idx,
        },
        {
          label: 'Active Policy IDs',
          getter: (p: BpfWorkloadPolicyValue) => <ChipList items={p.policyIds ?? []} max={4} />,
        },
        {
          label: 'Count',
          getter: (p: BpfWorkloadPolicyValue) => p.policyIds?.length ?? 0,
          sort: (p: BpfWorkloadPolicyValue) => p.policyIds?.length ?? 0,
        },
      ]}
      emptyMessage="No workload policy entries found in the BPF map."
    />
  );
}

// ---------------------------------------------------------------------------
// Generic loading / error guard (same pattern as XdsConfigDump.tsx)
// ---------------------------------------------------------------------------

interface BpfResourcePanelProps<T> {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: T[] | null;
  error: string | null;
  children: (data: T[]) => ReactNode;
}

/**
 * Renders a spinner while loading, a descriptive error on failure,
 * or delegates to the tab-specific content component on success.
 */
function BpfResourcePanel<T>({ status, data, error, children }: BpfResourcePanelProps<T>) {
  if (status === 'idle' || status === 'loading') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={28} />
      </Box>
    );
  }

  if (status === 'error') {
    // HTTP 400 = daemon is in kernel-native mode; BPF workload maps are not available.
    const isModeMismatch = /\b400\b/.test(error ?? '') || /Bad Request/i.test(error ?? '');
    return (
      <Typography color="error" variant="body2" sx={{ p: 2 }}>
        {isModeMismatch
          ? 'The Kmesh daemon is running in kernel-native (ADS) mode. ' +
            'The eBPF workload maps are only available in dual-engine (workload) mode.'
          : `Error fetching eBPF map data: ${error}`}
      </Typography>
    );
  }

  return <>{children(data ?? [])}</>;
}

// ---------------------------------------------------------------------------
// Tab type
// ---------------------------------------------------------------------------

type BpfTab = 'backends' | 'frontends' | 'services' | 'endpoints' | 'workloadPolicies';

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/**
 * eBPF Map Viewer page for Kmesh.
 *
 * Displays a tabbed interface (Backends / Frontends / Services / Endpoints /
 * Workload Policies) backed by the dual-engine BPF map dump endpoint.
 * All tabs share one HTTP round-trip thanks to the deduplication layer in
 * kmeshDaemonProxy.ts — switching tabs does not trigger additional requests.
 */
export default function EbpfMaps() {
  const [activeTab, setActiveTab] = useState<BpfTab>('backends');

  const { readyPod, loading: podsLoading, error: podsError } = useKmeshDaemonPods();
  const podName = readyPod?.name ?? null;

  // Single HTTP call — dedup layer ensures all tabs reuse the same response.
  const { status, data: dump, error } = useWorkloadBpfMaps(KMESH_NAMESPACE, podName);

  // Slice the relevant sub-array for each tab's panel.
  const backends = { status, data: dump?.backends ?? null, error };
  const frontends = { status, data: dump?.frontends ?? null, error };
  const services = { status, data: dump?.services ?? null, error };
  const endpoints = { status, data: dump?.endpoints ?? null, error };
  const workloadPolicies = { status, data: dump?.workloadPolicies ?? null, error };

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

  /** Tab label with live item count once data has loaded. */
  function tabLabel(id: BpfTab): string {
    if (status !== 'success' || !dump) return id.charAt(0).toUpperCase() + id.slice(1);
    const counts: Record<BpfTab, number> = {
      backends: dump.backends?.length ?? 0,
      frontends: dump.frontends?.length ?? 0,
      services: dump.services?.length ?? 0,
      endpoints: dump.endpoints?.length ?? 0,
      workloadPolicies: dump.workloadPolicies?.length ?? 0,
    };
    const labels: Record<BpfTab, string> = {
      backends: 'Backends',
      frontends: 'Frontends',
      services: 'Services',
      endpoints: 'Endpoints',
      workloadPolicies: 'Workload Policies',
    };
    return `${labels[id]} (${counts[id]})`;
  }

  return (
    <SectionBox
      title={PAGE_TITLE}
      headerProps={{
        titleSideActions: [
          <Typography key="pod" variant="caption" color="text.secondary">
            Pod: {readyPod.name} · Node: {readyPod.nodeName}
          </Typography>,
        ],
      }}
    >
      <Tabs
        value={activeTab}
        onChange={(_e, v: BpfTab) => setActiveTab(v)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 1 }}
      >
        <Tab value="backends" label={tabLabel('backends')} />
        <Tab value="frontends" label={tabLabel('frontends')} />
        <Tab value="services" label={tabLabel('services')} />
        <Tab value="endpoints" label={tabLabel('endpoints')} />
        <Tab value="workloadPolicies" label={tabLabel('workloadPolicies')} />
      </Tabs>

      {activeTab === 'backends' && (
        <BpfResourcePanel<BpfBackendValue> {...backends}>
          {data => <BackendsPanel backends={data} />}
        </BpfResourcePanel>
      )}

      {activeTab === 'frontends' && (
        <BpfResourcePanel<BpfFrontendValue> {...frontends}>
          {data => <FrontendsPanel frontends={data} />}
        </BpfResourcePanel>
      )}

      {activeTab === 'services' && (
        <BpfResourcePanel<BpfServiceValue> {...services}>
          {data => <ServicesPanel services={data} />}
        </BpfResourcePanel>
      )}

      {activeTab === 'endpoints' && (
        <BpfResourcePanel<BpfEndpointValue> {...endpoints}>
          {data => <EndpointsPanel endpoints={data} />}
        </BpfResourcePanel>
      )}

      {activeTab === 'workloadPolicies' && (
        <BpfResourcePanel<BpfWorkloadPolicyValue> {...workloadPolicies}>
          {data => <WorkloadPoliciesPanel policies={data} />}
        </BpfResourcePanel>
      )}
    </SectionBox>
  );
}
