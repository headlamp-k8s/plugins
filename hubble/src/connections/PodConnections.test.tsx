/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_ADAPTER_SERVICE } from '../utils/settings';
import type { FlowRecord } from './flows';
import PodConnections, { coverageText, errorText, observedText } from './PodConnections';
import { stitchConnections } from './stitch';
import { CONNECTIONS_REFRESH_MS } from './useConnections';

const getFlowSnapshot = vi.hoisted(() => vi.fn());
// The Cilium check: returns [CRDs found, error] like the lib's useList.
const useCrdList = vi.hoisted(() => vi.fn());

vi.mock('./flows', () => ({ getFlowSnapshot }));
vi.mock('../utils/settings', async importOriginal => ({
  ...(await importOriginal<typeof import('../utils/settings')>()),
  useAdapterService: () => DEFAULT_ADAPTER_SERVICE,
}));
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ConfigStore: class {},
  K8s: { ResourceClasses: { CustomResourceDefinition: { useList: useCrdList } } },
}));
vi.mock('@kinvolk/headlamp-plugin/lib/components/common', () => ({
  SectionBox: ({ title, children }: any) => (
    <section>
      <h2>{title}</h2>
      {children}
    </section>
  ),
  StatusLabel: ({ children }: any) => <span>{children}</span>,
  SimpleTable: ({ columns, data }: any) => (
    <table>
      <tbody>
        {data.map((row: any, index: number) => (
          <tr key={index}>
            {columns.map((column: any) => (
              <td key={column.label}>{column.getter(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),
}));

const pod = 'frontend-abc-11111';

function request(ms: number, dropped = false): FlowRecord {
  return {
    time: new Date(ms).toISOString(),
    verdict: dropped ? 'DROPPED' : 'FORWARDED',
    dropReason: dropped ? 'POLICY_DENIED' : undefined,
    observationPoint: 'TO_ENDPOINT',
    protocol: 'TCP',
    tcpFlags: { syn: true },
    source: { ip: '10.0.0.1', port: 40000 + ms, namespace: 'shop', pod, workload: 'frontend' },
    destination: {
      ip: dropped ? '10.0.0.4' : '10.0.0.3',
      port: 80,
      namespace: 'shop',
      pod: dropped ? 'database-0' : 'backend-def-33333',
      workload: dropped ? 'database' : 'backend',
    },
  };
}

describe('PodConnections', () => {
  const ciliumFound = () => [[{ metadata: { name: 'ciliumnetworkpolicies.cilium.io' } }], null];
  const show = () => <PodConnections cluster="prod" namespace="shop" pod={pod} />;

  beforeEach(() => {
    getFlowSnapshot.mockReset();
    useCrdList.mockReset();
    useCrdList.mockImplementation(ciliumFound);
  });

  it('checks for Cilium in the pod cluster as often as the table refreshes', async () => {
    getFlowSnapshot.mockResolvedValue({ flows: [], lostEvents: 0, unreadNodes: [] });
    render(show());

    await screen.findByText('No connections in the flows Hubble Relay still has.');
    expect(useCrdList).toHaveBeenCalledWith({
      cluster: 'prod',
      fieldSelector: 'metadata.name=ciliumnetworkpolicies.cilium.io',
      refetchInterval: CONNECTIONS_REFRESH_MS,
    });
  });

  it('shows nothing and never asks the adapter on a cluster without Cilium', async () => {
    vi.useFakeTimers();
    try {
      useCrdList.mockImplementation(() => [[], null]);
      const { container } = render(show());

      await act(() => vi.advanceTimersByTimeAsync(CONNECTIONS_REFRESH_MS * 3));
      expect(container.textContent).toBe('');
      expect(getFlowSnapshot).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('shows nothing until the first check answers, or when it can only fail', () => {
    for (const result of [
      [null, null],
      [null, { status: 403 }],
    ]) {
      useCrdList.mockImplementation(() => result);
      const { container, unmount } = render(show());
      expect(container.textContent).toBe('');
      unmount();
    }
    expect(getFlowSnapshot).not.toHaveBeenCalled();
  });

  it('starts the table once a later check finds Cilium', async () => {
    getFlowSnapshot.mockResolvedValue({ flows: [request(1)], lostEvents: 0, unreadNodes: [] });
    useCrdList.mockImplementation(() => [[], null]);
    const { rerender } = render(show());
    expect(getFlowSnapshot).not.toHaveBeenCalled();

    useCrdList.mockImplementation(ciliumFound);
    rerender(show());

    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(1));
    expect(getFlowSnapshot).toHaveBeenCalledTimes(1);
  });

  it('keeps the table when a later check fails, since the last answer had Cilium', async () => {
    getFlowSnapshot.mockResolvedValue({ flows: [request(1)], lostEvents: 0, unreadNodes: [] });
    const { rerender } = render(show());
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(1));

    useCrdList.mockImplementation(() => [ciliumFound()[0], { status: 500 }]);
    rerender(show());

    expect(screen.getAllByRole('row')).toHaveLength(1);
    expect(getFlowSnapshot).toHaveBeenCalledTimes(1);
  });

  it('warns that flows may be missing when Relay could not read a node', async () => {
    getFlowSnapshot.mockResolvedValue({
      flows: [request(1)],
      lostEvents: 0,
      unreadNodes: ['node-b'],
    });
    render(show());
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(1));
    expect(
      screen.getByText(
        "Hubble Relay couldn't read the flows of node node-b, so some connections may be missing."
      )
    ).toBeTruthy();
  });

  it('loads the flows of the pod and lists its connections, blocked first', async () => {
    getFlowSnapshot.mockResolvedValue({
      flows: [request(1), request(2), request(3, true)],
      lostEvents: 0,
      unreadNodes: [],
    });
    render(<PodConnections cluster="prod" namespace="shop" pod={pod} />);

    expect(screen.getByText('Loading flows…')).toBeTruthy();
    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(2));

    expect(getFlowSnapshot).toHaveBeenCalledWith('prod', DEFAULT_ADAPTER_SERVICE, {
      namespace: 'shop',
      pod,
    });
    const [blocked, delivered] = screen.getAllByRole('row').map(row => row.textContent);
    expect(blocked).toContain('shop/database');
    expect(blocked).toContain('Blocked (POLICY_DENIED)');
    expect(delivered).toContain('shop/backend');
    expect(delivered).toContain('Delivered');
    expect(screen.getByText(/^Observed 3 connection attempts over TCP between/)).toBeTruthy();
    expect(delivered).toContain('2 connection attempts');
  });

  it('says why when the adapter is missing', async () => {
    getFlowSnapshot.mockRejectedValue(
      Object.assign(new Error('Service Unavailable'), { status: 503 })
    );
    render(<PodConnections cluster="prod" namespace="shop" pod={pod} />);

    expect((await screen.findByRole('alert')).textContent).toContain(
      "Couldn't get flows from the hubble-flows-adapter Service in kube-system (503)."
    );
    expect(screen.queryByText('Loading flows…')).toBeNull();
  });

  it('does not ask for flows while the tab is hidden, and asks again when it is shown', async () => {
    vi.useFakeTimers();
    let hidden = false;
    const visibility = vi.spyOn(document, 'hidden', 'get').mockImplementation(() => hidden);
    try {
      getFlowSnapshot.mockResolvedValue({ flows: [request(1)], lostEvents: 0, unreadNodes: [] });
      render(<PodConnections cluster="prod" namespace="shop" pod={pod} />);
      expect(getFlowSnapshot).toHaveBeenCalledTimes(1);

      hidden = true;
      await act(() => vi.advanceTimersByTimeAsync(CONNECTIONS_REFRESH_MS * 3));
      expect(getFlowSnapshot).toHaveBeenCalledTimes(1);

      hidden = false;
      await act(async () => {
        document.dispatchEvent(new Event('visibilitychange'));
      });
      expect(getFlowSnapshot).toHaveBeenCalledTimes(2);
    } finally {
      visibility.mockRestore();
      vi.useRealTimers();
    }
  });

  it('says when a connection got through after a drop', async () => {
    const syn = request(1);
    getFlowSnapshot.mockResolvedValue({
      flows: [
        { ...syn, verdict: 'DROPPED', dropReason: 'POLICY_DENIED', observationPoint: '' },
        { ...syn, time: new Date(2).toISOString() },
      ],
      lostEvents: 0,
      unreadNodes: [],
    });
    render(show());

    await waitFor(() => expect(screen.getAllByRole('row')).toHaveLength(1));
    expect(screen.getByRole('row').textContent).toContain('Delivered after a drop (POLICY_DENIED)');
  });

  it('says when Relay has nothing for the pod', async () => {
    getFlowSnapshot.mockResolvedValue({ flows: [], lostEvents: 0, unreadNodes: [] });
    render(<PodConnections cluster="prod" namespace="shop" pod={pod} />);

    expect(
      await screen.findByText('No connections in the flows Hubble Relay still has.')
    ).toBeTruthy();
  });
});

describe('coverageText', () => {
  it('mentions events Hubble lost', () => {
    const connections = stitchConnections([request(1)]);
    expect(
      coverageText({ connections, lostEvents: 0, unreadNodes: [], error: null })
    ).not.toContain('lost');
    expect(coverageText({ connections, lostEvents: 12, unreadNodes: [], error: null })).toContain(
      'Hubble lost 12 events on the nodes'
    );
  });

  it('mentions lost events and unread nodes also when there are no connections', () => {
    const empty = { connections: [], lostEvents: 0, unreadNodes: [], error: null };
    expect(coverageText(empty)).toBe('No connections in the flows Hubble Relay still has.');
    expect(coverageText({ ...empty, lostEvents: 3 })).toBe(
      'No connections in the flows Hubble Relay still has. Hubble lost 3 events on the nodes, so some may be missing.'
    );
    expect(coverageText({ ...empty, unreadNodes: ['node-b'] })).toBe(
      'No connections in the flows Hubble Relay could read.'
    );
  });
});

describe('observedText', () => {
  it('counts TCP as connection attempts and other protocols as flow events', () => {
    expect(observedText('TCP', 1)).toBe('1 connection attempt');
    expect(observedText('TCP', 21)).toBe('21 connection attempts');
    expect(observedText('UDP', 1)).toBe('1 flow event');
    expect(observedText('UDP', 243)).toBe('243 flow events');
  });
});

describe('errorText', () => {
  const text = (status?: number) =>
    errorText({ status, message: 'boom' }, { namespace: 'cilium', name: 'flows', port: 'http' });

  it('explains each kind of failure for the configured Service', () => {
    expect(text(403)).toBe(
      "You don't have permission to use the proxy of the flows Service in cilium."
    );
    for (const status of [404, 503]) {
      expect(text(status)).toContain(
        `Couldn't get flows from the flows Service in cilium (${status}).`
      );
    }
    for (const status of [502, 504]) {
      expect(text(status)).toBe(
        `Hubble Relay didn't answer the flows Service in cilium (${status}). Check that Relay is running.`
      );
    }
    expect(text()).toBe("Couldn't load flows from the flows Service in cilium: boom");
  });
});
