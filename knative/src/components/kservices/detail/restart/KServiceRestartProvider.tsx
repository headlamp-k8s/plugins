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

import React from 'react';
import type { KService } from '../../../../resources/knative';
import { KServiceRestartTracker } from './KServiceRestartTracker';

/** A restart that is under way. */
type RestartSession = {
  /** Cluster the Knative Service runs in. */
  cluster: string;
  /** Namespace of the Knative Service. */
  namespace: string;
  /** Name of the Knative Service. */
  serviceName: string;
  /** Called once the result has been shown, if the restart reached the running Deployments. */
  onDone?: () => void;
};

/** The restarts of a page, shared through the context. */
type KServiceRestarts = {
  /** Keys of the Knative Services that are being restarted. */
  restarting: ReadonlySet<string>;
  /** Starts a restart; nothing happens when the Service is being restarted already. */
  start: (session: RestartSession) => void;
};

const KServiceRestartContext = React.createContext<KServiceRestarts | null>(null);

/**
 * Identifies a Knative Service.
 *
 * @param cluster - Cluster the Service runs in.
 * @param namespace - Namespace of the Service.
 * @param serviceName - Name of the Service.
 * @returns A key that is the same for the same Service.
 */
function sessionKey(cluster: string, namespace: string, serviceName: string): string {
  return `${cluster}/${namespace}/${serviceName}`;
}

/** The props of {@link KServiceRestartProvider}. */
type KServiceRestartProviderProps = {
  /** The page, whose components start restarts through `useKServiceRestart`. */
  children: React.ReactNode;
};

/**
 * Keeps the restarts of a page. Each restart gets a {@link KServiceRestartTracker} for as long as
 * it lasts, so that a restart goes on, and shows its result, when the menu or button that started
 * it is gone. Restarts end with the page.
 *
 * @param props - The components that start restarts through `useKServiceRestart`.
 * @returns The children, with the restarts available through `useKServiceRestart`.
 */
export function KServiceRestartProvider({ children }: KServiceRestartProviderProps) {
  const [sessions, setSessions] = React.useState<ReadonlyMap<string, RestartSession>>(new Map());

  const start = React.useCallback((session: RestartSession) => {
    const key = sessionKey(session.cluster, session.namespace, session.serviceName);
    setSessions(current => (current.has(key) ? current : new Map(current).set(key, session)));
  }, []);

  const finish = React.useCallback((key: string) => {
    setSessions(current => {
      const next = new Map(current);
      next.delete(key);
      return next;
    });
  }, []);

  const value = React.useMemo<KServiceRestarts>(
    () => ({ restarting: new Set(sessions.keys()), start }),
    [sessions, start]
  );

  return (
    <KServiceRestartContext.Provider value={value}>
      {children}
      {Array.from(sessions, ([key, session]) => (
        <KServiceRestartTracker
          key={key}
          cluster={session.cluster}
          namespace={session.namespace}
          serviceName={session.serviceName}
          onFinished={callOnDone => {
            if (callOnDone) {
              session.onDone?.();
            }
            finish(key);
          }}
        />
      ))}
    </KServiceRestartContext.Provider>
  );
}

/**
 * Gives access to the restart of a Knative Service. Must be used within a
 * `KServiceRestartProvider`.
 *
 * @param kservice - The Knative Service; nothing can be restarted until it has loaded.
 * @returns `restarting`, whether the Service is being restarted, and `restart`, which starts a
 * restart and calls `onDone` once its result has been shown, if it reached the running Deployments.
 */
export function useKServiceRestart(kservice: KService | null | undefined) {
  const context = React.useContext(KServiceRestartContext);
  if (!context) {
    throw new Error('useKServiceRestart must be used within a KServiceRestartProvider');
  }
  const { restarting: restartingKeys, start } = context;

  const cluster = kservice?.cluster;
  const namespace = kservice?.metadata.namespace;
  const serviceName = kservice?.metadata.name;
  const ready = !!cluster && !!namespace && !!serviceName;

  const restart = React.useCallback(
    (onDone?: () => void) => {
      if (cluster && namespace && serviceName) {
        start({ cluster, namespace, serviceName, onDone });
      }
    },
    [cluster, namespace, serviceName, start]
  );

  return {
    restarting: ready && restartingKeys.has(sessionKey(cluster, namespace, serviceName)),
    restart,
  };
}
