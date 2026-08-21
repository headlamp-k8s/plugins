import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockUseGet, mockUseParams } = vi.hoisted(() => ({
  mockUseGet: vi.fn(),
  mockUseParams: vi.fn(() => ({})),
}));

vi.mock('react-router-dom', () => ({
  useParams: mockUseParams,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  ObjectEventList: () => null,
  SectionBox: ({ title, children }: any) => <div data-testid={`section-${title}`}>{children}</div>,
  SimpleTable: ({ data }: any) => <div data-testid="conditions-table">{JSON.stringify(data)}</div>,
  StatusLabel: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  MainInfoSection: ({ title, error, extraInfo }: any) => (
    <div data-testid="main-info-section">
      <span>{title}</span>
      {error && <span data-testid="error">{String(error)}</span>}
      {extraInfo?.map((info: any) => (
        <div key={info.name}>
          {info.name}: {String(info.value)}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('../../resources/waypoint', () => ({
  Waypoint: { useGet: mockUseGet },
}));

import WaypointDetail from './Detail';

afterEach(() => {
  cleanup();
  mockUseGet.mockReset();
  mockUseParams.mockReset().mockReturnValue({});
});

describe('WaypointDetail', () => {
  it('shows a params-missing error when neither props nor route params supply name/namespace', () => {
    render(<WaypointDetail />);
    expect(screen.getByTestId('error').textContent).toMatch(/route params missing/i);
  });

  it('renders waypoint fields once the resource loads', () => {
    mockUseGet.mockReturnValue([
      {
        spec: { gatewayClassName: 'kmesh-waypoint' },
        image: 'kmesh-daemon:v1',
        currentStatus: 'Programmed',
        status: { conditions: [] },
      },
      null,
    ]);

    render(<WaypointDetail name="my-waypoint" namespace="default" />);

    expect(mockUseGet).toHaveBeenCalledWith('my-waypoint', 'default', { cluster: undefined });
    expect(screen.getByText(/Gateway Class: kmesh-waypoint/)).toBeTruthy();
    expect(screen.getByText(/Image: kmesh-daemon:v1/)).toBeTruthy();
    expect(screen.getByText(/Current Status: Programmed/)).toBeTruthy();
  });

  it('renders a Conditions section when the waypoint has status conditions', () => {
    mockUseGet.mockReturnValue([
      {
        spec: { gatewayClassName: 'kmesh-waypoint' },
        image: 'kmesh-daemon:v1',
        currentStatus: 'Programmed',
        status: { conditions: [{ type: 'Programmed', status: 'True' }] },
      },
      null,
    ]);

    render(<WaypointDetail name="my-waypoint" namespace="default" />);

    expect(screen.getByTestId('section-Conditions')).toBeTruthy();
  });

  it('falls back to route params when no explicit props are passed', () => {
    mockUseParams.mockReturnValue({ name: 'route-waypoint', namespace: 'route-ns' });
    mockUseGet.mockReturnValue([null, null]);

    render(<WaypointDetail />);

    expect(mockUseGet).toHaveBeenCalledWith('route-waypoint', 'route-ns', { cluster: undefined });
  });
});
