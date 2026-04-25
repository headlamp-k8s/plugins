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

import React, { createContext, useContext } from 'react';
import { useAuthorization } from '../../../../hooks/useAuthorization';
import { KRevision } from '../../../../resources/knative';

interface RevisionPermissions {
  /** Whether the user can delete a revision. */
  canDeleteRevision: boolean | null;
  /** Whether any permission check is still loading. */
  isLoading: boolean;
}

interface RevisionPermissionsProviderProps {
  revision: KRevision;
  children: React.ReactNode;
}

const RevisionPermissionsContext = createContext<RevisionPermissions | null>(null);

/**
 * Provider that checks all Revision-related permissions and makes them available via context.
 * This centralizes permission checks to avoid duplicate queries and ensures unidirectional data flow.
 */
export function RevisionPermissionsProvider({
  revision,
  children,
}: RevisionPermissionsProviderProps) {
  const namespace = revision.metadata.namespace;
  const cluster = revision.cluster;

  // Check Revision delete permission
  const deleteRevision = useAuthorization({
    item: KRevision,
    authVerb: 'delete',
    namespace,
    cluster,
  });

  const permissions: RevisionPermissions = {
    canDeleteRevision: deleteRevision.allowed,
    isLoading: deleteRevision.isLoading,
  };

  return (
    <RevisionPermissionsContext.Provider value={permissions}>
      {children}
    </RevisionPermissionsContext.Provider>
  );
}

/**
 * Hook to access Revision permissions from context.
 * Must be used within a RevisionPermissionsProvider.
 */
export function useRevisionPermissions(): RevisionPermissions {
  const context = useContext(RevisionPermissionsContext);
  if (!context) {
    throw new Error('useRevisionPermissions must be used within a RevisionPermissionsProvider');
  }
  return context;
}
