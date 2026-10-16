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

import Pod from '@kinvolk/headlamp-plugin/lib/k8s/pod';
import React, { createContext, useContext } from 'react';
import { useAuthorization } from '../../../../hooks/useAuthorization';
import { ClusterDomainClaim, KnativeDomainMapping, KService } from '../../../../resources/knative';
import { useCanRestartKService } from '../hooks/useCanRestartKService';

interface KServicePermissions {
  /** Whether the user can patch the KService. */
  canPatchKService: boolean | null;
  /** Whether the user can list, watch and patch Deployments (for restart operation). */
  canRestart: boolean | null;
  /** Whether the user can get pod logs. */
  canGetPodLogs: boolean | null;
  /** Whether the user can create DomainMapping resources. */
  canCreateDomainMapping: boolean | null;
  /** Whether the user can create ClusterDomainClaim resources. */
  canCreateClusterDomainClaim: boolean | null;
  /** Whether any permission check is still loading. */
  isLoading: boolean;
}

const KServicePermissionsContext = createContext<KServicePermissions | null>(null);

interface KServicePermissionsProviderProps {
  kservice: KService;
  children: React.ReactNode;
}

/**
 * Provider that checks all KService-related permissions and makes them available via context.
 * This centralizes permission checks to avoid duplicate queries and ensures unidirectional data
 * flow.
 *
 * @param props - The Knative Service whose permissions are checked, and the components that use
 * them.
 * @returns The children, with the permissions available through `useKServicePermissions`.
 */
export function KServicePermissionsProvider({
  kservice,
  children,
}: KServicePermissionsProviderProps) {
  const namespace = kservice.metadata.namespace;
  const cluster = kservice.cluster;

  // Check KService patch permission
  const patchKService = useAuthorization({
    item: KService,
    authVerb: 'patch',
    namespace,
    cluster,
  });

  const restart = useCanRestartKService(namespace, cluster);

  // Check Pod logs get permission
  const getPodLogs = useAuthorization({
    item: Pod,
    authVerb: 'get',
    subresource: 'log',
    namespace,
    cluster,
  });

  // Check DomainMapping create permission
  const createDomainMapping = useAuthorization({
    item: KnativeDomainMapping,
    authVerb: 'create',
    namespace,
    cluster,
  });

  // Check ClusterDomainClaim create permission
  const createClusterDomainClaim = useAuthorization({
    item: ClusterDomainClaim,
    authVerb: 'create',
    cluster,
  });

  const permissions: KServicePermissions = {
    canPatchKService: patchKService.allowed,
    canRestart: restart.allowed,
    canGetPodLogs: getPodLogs.allowed,
    canCreateDomainMapping: createDomainMapping.allowed,
    canCreateClusterDomainClaim: createClusterDomainClaim.allowed,
    isLoading:
      patchKService.isLoading ||
      restart.isLoading ||
      getPodLogs.isLoading ||
      createDomainMapping.isLoading ||
      createClusterDomainClaim.isLoading,
  };

  return (
    <KServicePermissionsContext.Provider value={permissions}>
      {children}
    </KServicePermissionsContext.Provider>
  );
}

/**
 * Hook to access KService permissions from context.
 * Must be used within a KServicePermissionsProvider.
 */
export function useKServicePermissions(): KServicePermissions {
  const context = useContext(KServicePermissionsContext);
  if (!context) {
    throw new Error('useKServicePermissions must be used within a KServicePermissionsProvider');
  }
  return context;
}
