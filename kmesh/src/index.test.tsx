import { describe, expect, it, vi } from 'vitest';
import { kmeshRouteNames, kmeshRoutePaths } from './utils/kmeshRoutes';

const { mockRegisterRoute, mockRegisterSidebarEntry, mockRegisterDetailsViewSection } = vi.hoisted(
  () => ({
    mockRegisterRoute: vi.fn(),
    mockRegisterSidebarEntry: vi.fn(),
    mockRegisterDetailsViewSection: vi.fn(),
  })
);

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  registerRoute: mockRegisterRoute,
  registerSidebarEntry: mockRegisterSidebarEntry,
  registerDetailsViewSection: mockRegisterDetailsViewSection,
  Activity: { launch: vi.fn() },
  ApiProxy: { request: vi.fn() },
  K8s: { ResourceClasses: { Namespace: class Namespace {} } },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  SectionBox: () => null,
  SimpleTable: () => null,
  StatusLabel: () => null,
  ResourceListView: () => null,
  MainInfoSection: () => null,
  ObjectEventList: () => null,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  MainInfoSection: () => null,
}));

// Several modules import subpaths like '@kinvolk/headlamp-plugin/lib/k8s'
// and '@kinvolk/headlamp-plugin/lib/k8s/cluster' that only resolve via
// tsc's path-mapping and the production bundler's externals — not via
// Vite's real module resolution used in tests. Mock the modules that
// import them directly so their real bodies (and those unresolvable
// imports) are never loaded.
vi.mock('./hooks/useKmeshDaemonPods', () => ({
  useKmeshDaemonPods: () => ({ loading: false, error: null, pods: [], readyPod: null }),
}));

vi.mock('./resources/waypoint', () => ({
  Waypoint: class Waypoint {},
  KMESH_WAYPOINT_GATEWAY_CLASS: 'kmesh-waypoint',
}));

vi.mock('./resources/kmeshNodeInfo', () => ({
  KmeshNodeInfo: class KmeshNodeInfo {},
}));

const idleState = { status: 'idle', data: null, error: null };
vi.mock('./hooks/useDaemonRequest', () => ({
  useKmeshVersion: () => idleState,
  useWorkloadConfigDump: () => idleState,
  useKmeshLoggers: () => idleState,
  useWorkloadBpfMaps: () => idleState,
  useXdsClusters: () => idleState,
  useXdsListeners: () => idleState,
  useXdsRoutes: () => idleState,
}));

vi.mock('@iconify/react', () => ({
  Icon: () => null,
}));

vi.mock('react-router-dom', () => ({
  useParams: () => ({}),
}));

// Static import triggers the module's top-level registration calls.
// vi.mock is hoisted above this by vitest, so mocks are ready.
import './index';

describe('kmesh plugin registration', () => {
  it('registers the parent sidebar entry', () => {
    expect(mockRegisterSidebarEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        parent: null,
        name: 'kmesh',
        label: 'KMesh',
        icon: 'mdi:vector-triangle',
        url: kmeshRoutePaths.waypointsList,
      })
    );
  });

  it('registers the waypoint list and detail routes', () => {
    expect(mockRegisterSidebarEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        parent: 'kmesh',
        name: 'kmesh-waypoints',
        label: 'Waypoints',
        url: kmeshRoutePaths.waypointsList,
      })
    );
    expect(mockRegisterRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: kmeshRoutePaths.waypointsList,
        name: kmeshRouteNames.waypointsList,
        sidebar: 'kmesh-waypoints',
        exact: true,
      })
    );
    expect(mockRegisterRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: kmeshRoutePaths.waypointDetail,
        name: kmeshRouteNames.waypointDetail,
        sidebar: 'kmesh-waypoints',
        exact: true,
      })
    );
  });

  it('registers the node security (KmeshNodeInfo) list and detail routes', () => {
    expect(mockRegisterSidebarEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        parent: 'kmesh',
        name: 'kmesh-node-security',
        label: 'Node Security',
        url: kmeshRoutePaths.nodeInfoList,
      })
    );
    expect(mockRegisterRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: kmeshRoutePaths.nodeInfoList,
        name: kmeshRouteNames.nodeInfoList,
        sidebar: 'kmesh-node-security',
        exact: true,
      })
    );
    expect(mockRegisterRoute).toHaveBeenCalledWith(
      expect.objectContaining({
        path: kmeshRoutePaths.nodeInfoDetail,
        name: kmeshRouteNames.nodeInfoDetail,
        sidebar: 'kmesh-node-security',
        exact: true,
      })
    );
  });

  it.each([
    [
      'xDS Config Dump',
      'kmesh-xds-config',
      kmeshRoutePaths.xdsConfigDump,
      kmeshRouteNames.xdsConfigDump,
    ],
    [
      'Daemon Health',
      'kmesh-health',
      kmeshRoutePaths.healthDashboard,
      kmeshRouteNames.healthDashboard,
    ],
    [
      'Observability',
      'kmesh-observability',
      kmeshRoutePaths.observability,
      kmeshRouteNames.observability,
    ],
    [
      'Auth Policies',
      'kmesh-authz-policies',
      kmeshRoutePaths.authzPolicies,
      kmeshRouteNames.authzPolicies,
    ],
    ['eBPF Maps', 'kmesh-ebpf-maps', kmeshRoutePaths.ebpfMaps, kmeshRouteNames.ebpfMaps],
  ])('registers the %s single route', (label, sidebarName, path, routeName) => {
    expect(mockRegisterSidebarEntry).toHaveBeenCalledWith(
      expect.objectContaining({ parent: 'kmesh', name: sidebarName, label, url: path })
    );
    expect(mockRegisterRoute).toHaveBeenCalledWith(
      expect.objectContaining({ path, name: routeName, sidebar: sidebarName, exact: true })
    );
  });

  it('registers the Namespace Enrollment details view section', () => {
    expect(mockRegisterDetailsViewSection).toHaveBeenCalledTimes(1);
    expect(mockRegisterDetailsViewSection).toHaveBeenCalledWith(expect.any(Function));
  });
});
