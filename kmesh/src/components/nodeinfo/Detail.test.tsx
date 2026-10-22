import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockUseList, mockUseParams } = vi.hoisted(() => ({
  mockUseList: vi.fn(),
  mockUseParams: vi.fn(() => ({})),
}));

vi.mock('react-router-dom', () => ({
  useParams: mockUseParams,
}));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
  MainInfoSection: ({ extraInfo }: any) => (
    <div data-testid="main-info-section">
      {extraInfo?.map((info: any) => (
        <div key={info.name}>
          {info.name}: {String(info.value)}
        </div>
      ))}
    </div>
  ),
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

vi.mock('../../resources/kmeshNodeInfo', () => ({
  KmeshNodeInfo: { useList: mockUseList },
}));

import KmeshNodeInfoDetail from './Detail';

afterEach(() => {
  cleanup();
  mockUseList.mockReset();
  mockUseParams.mockReset().mockReturnValue({});
});

function nodeInfo(name: string, spi: number) {
  return {
    getName: () => name,
    spi,
    addresses: ['10.0.0.1'],
    podCIDRS: ['10.244.0.0/24'],
    bootID: 'boot-1',
  };
}

describe('KmeshNodeInfoDetail', () => {
  it('shows a not-found message when no node matches the route params', () => {
    mockUseParams.mockReturnValue({ namespace: 'kmesh-system', name: 'missing' });
    mockUseList.mockReturnValue([[nodeInfo('node-1', 5)], null]);

    render(<KmeshNodeInfoDetail />);

    expect(screen.getByText(/KmeshNodeInfo "missing" not found/)).toBeTruthy();
  });

  it('renders SPI and boot ID once the matching node loads', () => {
    mockUseParams.mockReturnValue({ namespace: 'kmesh-system', name: 'node-1' });
    mockUseList.mockReturnValue([[nodeInfo('node-1', 5)], null]);

    render(<KmeshNodeInfoDetail />);

    expect(screen.getByText(/SPI \(Key Version\): v5/)).toBeTruthy();
    expect(screen.getByText(/Boot ID: boot-1/)).toBeTruthy();
  });

  it('flags a stale node against the multi-node cluster consensus', () => {
    mockUseParams.mockReturnValue({ namespace: 'kmesh-system', name: 'node-3' });
    mockUseList.mockReturnValue([
      [nodeInfo('node-1', 5), nodeInfo('node-2', 5), nodeInfo('node-3', 4)],
      null,
    ]);

    render(<KmeshNodeInfoDetail />);

    expect(screen.getByText(/Stale IPsec Key Detected/)).toBeTruthy();
  });
});
