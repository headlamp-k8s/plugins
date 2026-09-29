import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { mockUseGet, mockPodUseList, mockServiceUseList, mockNamespaceUseList, mockUseParams } =
  vi.hoisted(() => ({
    mockUseGet: vi.fn(),
    mockPodUseList: vi.fn(),
    mockServiceUseList: vi.fn(),
    mockNamespaceUseList: vi.fn(),
    mockUseParams: vi.fn(() => ({})),
  }));

vi.mock('react-router-dom', () => ({
  useParams: mockUseParams,
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    ResourceClasses: {
      Pod: { useList: mockPodUseList },
      Service: { useList: mockServiceUseList },
      Namespace: { useList: mockNamespaceUseList },
    },
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  ObjectEventList: () => null,
  SectionBox: ({ title, children }: any) => <div data-testid={`section-${title}`}>{children}</div>,
  SimpleTable: ({ data, columns }: any) => (
    <table>
      <tbody>
        {data.map((row: any, i: number) => (
          <tr key={i}>
            {columns.map((col: any) => (
              <td key={col.label}>{col.getter(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
  StatusLabel: ({ children }: any) => <span>{children}</span>,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  MainInfoSection: ({ extraInfo }: any) => (
    <div data-testid="main-info-section">
      {extraInfo?.map((info: any) => (
        <div key={info.name}>
          {info.name}: {String(info.value)}
        </div>
      ))}
    </div>
  ),
  Link: ({ kubeObject, children }: any) => <span>{children ?? kubeObject?.getName()}</span>,
}));

vi.mock('../../resources/waypoint', () => ({
  Waypoint: { useGet: mockUseGet },
}));

import WaypointDetail from './Detail';

beforeEach(() => {
  mockPodUseList.mockReturnValue([[]]);
  mockServiceUseList.mockReturnValue([[]]);
  mockNamespaceUseList.mockReturnValue([[]]);
});

afterEach(() => {
  cleanup();
  mockUseGet.mockReset();
  mockPodUseList.mockReset();
  mockServiceUseList.mockReset();
  mockNamespaceUseList.mockReset();
  mockUseParams.mockReset().mockReturnValue({});
});

function waypoint(overrides: Record<string, any> = {}) {
  return {
    spec: { gatewayClassName: 'kmesh-waypoint' },
    status: { conditions: [] },
    image: 'kmesh/waypoint:latest',
    currentStatus: 'Programmed',
    getName: () => 'my-waypoint',
    metadata: { uid: 'waypoint-uid', namespace: 'default' },
    ...overrides,
  };
}

function pod(name: string) {
  return { getName: () => name, metadata: { uid: `pod-${name}` } };
}

function service(name: string) {
  return { getName: () => name, metadata: { uid: `svc-${name}` } };
}

function namespace(name: string, labels: Record<string, string> = {}) {
  return { getName: () => name, metadata: { uid: `ns-${name}`, labels } };
}

describe('WaypointDetail related resources', () => {
  it('shows "None found" for all related resource rows when nothing matches', () => {
    mockUseParams.mockReturnValue({ namespace: 'default', name: 'my-waypoint' });
    mockUseGet.mockReturnValue([waypoint(), null]);

    render(<WaypointDetail />);

    expect(screen.getAllByText('None found')).toHaveLength(3);
  });

  it('renders links for proxy pods, the proxy service, and enrolled namespaces', () => {
    mockUseParams.mockReturnValue({ namespace: 'default', name: 'my-waypoint' });
    mockUseGet.mockReturnValue([waypoint(), null]);
    mockPodUseList.mockReturnValue([[pod('my-waypoint-abcde')]]);
    mockServiceUseList.mockReturnValue([[service('my-waypoint')]]);
    mockNamespaceUseList.mockReturnValue([
      [namespace('team-a', { 'istio.io/use-waypoint': 'my-waypoint' }), namespace('team-b')],
    ]);

    render(<WaypointDetail />);

    expect(screen.getByText('my-waypoint-abcde')).toBeTruthy();
    expect(screen.getByText('team-a')).toBeTruthy();
    expect(screen.queryByText('team-b')).toBeNull();
  });
});
