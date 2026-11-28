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

import { useEffect, useState } from 'react';
import type { AdapterService } from '../utils/settings';
import { getFlowSnapshot } from './flows';
import { type Connection, stitchConnections } from './stitch';

/** How often the snapshot is asked for again while the page is open. */
export const CONNECTIONS_REFRESH_MS = 10000;

/** Why the flows couldn't be loaded. */
export interface ConnectionsError {
  /** The HTTP status, when there was an answer. */
  status?: number;
  message: string;
}

/** What the views need: the connections, or why they couldn't be loaded. */
export interface ConnectionsState {
  /** Null until the first snapshot arrives. */
  connections: Connection[] | null;
  lostEvents: number;
  /** Nodes Hubble Relay couldn't read, so their flows are missing. */
  unreadNodes: string[];
  error: ConnectionsError | null;
}

const EMPTY: ConnectionsState = { connections: null, lostEvents: 0, unreadNodes: [], error: null };

/**
 * Loads a pod's recent flows from the adapter, stitches them into connections, and does
 * it again every few seconds while the tab is shown, and right away when it's shown
 * again. A refresh that is still running is not started twice.
 * When a refresh fails, the last connections stay and the error is set.
 *
 * @param cluster - The cluster to ask.
 * @param service - Where the adapter's Service is.
 * @param namespace - The pod's namespace.
 * @param pod - The pod's name.
 */
export function useConnections(
  cluster: string,
  service: AdapterService,
  namespace: string,
  pod: string
): ConnectionsState {
  const [state, setState] = useState<ConnectionsState>(EMPTY);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    setState(EMPTY);

    async function load() {
      // A pod's flows can be a megabyte, so a tab in the background doesn't ask for them.
      // The next refresh after the tab is shown again catches up.
      if (inFlight || document.hidden) {
        return;
      }
      inFlight = true;
      try {
        const { flows, lostEvents, unreadNodes } = await getFlowSnapshot(cluster, service, {
          namespace,
          pod,
        });
        if (!cancelled) {
          setState({ connections: stitchConnections(flows), lostEvents, unreadNodes, error: null });
        }
      } catch (err) {
        if (!cancelled) {
          const { status, message } = err as { status?: number; message?: string };
          setState(previous => ({
            ...previous,
            error: { status, message: message ?? String(err) },
          }));
        }
      } finally {
        inFlight = false;
      }
    }

    load();
    const timer = setInterval(load, CONNECTIONS_REFRESH_MS);
    document.addEventListener('visibilitychange', load);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', load);
    };
  }, [cluster, service, namespace, pod]);

  return state;
}
