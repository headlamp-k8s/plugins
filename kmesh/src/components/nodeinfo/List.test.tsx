import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const { mockUseList } = vi.hoisted(() => ({ mockUseList: vi.fn() }));

vi.mock('@kinvolk/headlamp-plugin/lib/CommonComponents', () => ({
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

vi.mock('../../resources/kmeshNodeInfo', () => ({
  KmeshNodeInfo: { useList: mockUseList },
}));

import KmeshNodeInfoList from './List';

afterEach(() => {
  cleanup();
  mockUseList.mockReset();
});

function nodeInfo(name: string, spi: number, overrides: Record<string, any> = {}) {
  return {
    getName: () => name,
    spi,
    addresses: ['10.0.0.1'],
    podCIDRS: ['10.244.0.0/24'],
    bootID: 'boot-1',
    ...overrides,
  };
}

describe('KmeshNodeInfoList', () => {
  it('shows a loading state while the list is undefined', () => {
    mockUseList.mockReturnValue([undefined, null]);
    render(<KmeshNodeInfoList />);
    expect(screen.getByTestId('section-Node Security (IPsec)')).toBeTruthy();
  });

  it('shows an error message when the list call fails', () => {
    mockUseList.mockReturnValue([null, new Error('boom')]);
    render(<KmeshNodeInfoList />);
    expect(screen.getByText(/Error loading KmeshNodeInfo: Error: boom/)).toBeTruthy();
  });

  it('shows an empty-state message when there are no KmeshNodeInfo resources', () => {
    mockUseList.mockReturnValue([[], null]);
    render(<KmeshNodeInfoList />);
    expect(screen.getByText(/No KmeshNodeInfo resources found/)).toBeTruthy();
  });

  it('reports all nodes in sync when every SPI matches', () => {
    mockUseList.mockReturnValue([[nodeInfo('node-1', 5), nodeInfo('node-2', 5)], null]);
    render(<KmeshNodeInfoList />);
    expect(screen.getByText(/All nodes in sync/)).toBeTruthy();
  });

  it('flags the minority node(s) whose SPI does not match cluster consensus', () => {
    mockUseList.mockReturnValue([
      [nodeInfo('node-1', 5), nodeInfo('node-2', 5), nodeInfo('node-3', 4)],
      null,
    ]);
    render(<KmeshNodeInfoList />);

    expect(screen.getByText(/SPI Mismatch Detected/)).toBeTruthy();
    expect(screen.getByText(/1 node\(s\) have stale SPI keys: node-3/)).toBeTruthy();
  });
});
