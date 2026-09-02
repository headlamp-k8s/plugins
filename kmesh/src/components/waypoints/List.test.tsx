import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockActivityLaunch, mockResourceListView } = vi.hoisted(() => ({
  mockActivityLaunch: vi.fn(),
  mockResourceListView: vi.fn<(props: any) => null>(() => null),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  Activity: { launch: mockActivityLaunch },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  ResourceListView: (props: any) => mockResourceListView(props),
}));

vi.mock('@iconify/react', () => ({
  Icon: () => null,
}));

// Detail.tsx pulls in the real Waypoint resource class, which imports an
// unresolvable subpath under this test environment (see index.test.tsx).
vi.mock('./Detail', () => ({
  default: () => null,
}));

vi.mock('../../resources/waypoint', () => ({
  Waypoint: class Waypoint {},
  KMESH_WAYPOINT_GATEWAY_CLASS: 'kmesh-waypoint',
}));

import WaypointList from './List';

afterEach(cleanup);

function makeWaypoint(overrides: Record<string, any> = {}) {
  return {
    cluster: 'default',
    metadata: { name: 'my-waypoint', namespace: 'default' },
    spec: { gatewayClassName: 'kmesh-waypoint' },
    image: 'kmesh-daemon:v1',
    currentStatus: 'Programmed',
    ...overrides,
  };
}

describe('WaypointList', () => {
  it('renders a ResourceListView scoped to the Waypoint resource class', () => {
    render(<WaypointList />);

    expect(mockResourceListView).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'KMesh Waypoints' })
    );
  });

  it('filters out Gateways that are not KMesh waypoints', () => {
    render(<WaypointList />);
    const { filterFunction } = mockResourceListView.mock.calls[0][0];

    expect(filterFunction(makeWaypoint())).toBe(true);
    expect(filterFunction(makeWaypoint({ spec: { gatewayClassName: 'other-class' } }))).toBe(false);
    expect(filterFunction(makeWaypoint({ spec: {} }))).toBe(false);
  });

  it('derives name, image, and status columns from the Waypoint item', () => {
    render(<WaypointList />);
    const { columns } = mockResourceListView.mock.calls[0][0];
    const waypoint = makeWaypoint();

    const nameColumn = columns.find((c: any) => c.id === 'waypoint-name');
    const imageColumn = columns.find((c: any) => c.id === 'image');
    const statusColumn = columns.find((c: any) => c.id === 'status');

    expect(nameColumn.getValue(waypoint)).toBe('my-waypoint');
    expect(imageColumn.getValue(waypoint)).toBe('kmesh-daemon:v1');
    expect(statusColumn.getValue(waypoint)).toBe('Programmed');
  });

  it('opens the waypoint detail panel via Activity.launch when the name link is clicked', async () => {
    render(<WaypointList />);
    const { columns } = mockResourceListView.mock.calls[0][0];
    const waypoint = makeWaypoint();
    const nameColumn = columns.find((c: any) => c.id === 'waypoint-name');

    render(nameColumn.render(waypoint));
    (await screen.findByRole('button', { name: 'my-waypoint' })).click();

    expect(mockActivityLaunch).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'kmesh-waypoint-default-default-my-waypoint',
        location: 'split-right',
        cluster: 'default',
        title: 'my-waypoint',
      })
    );
  });
});
