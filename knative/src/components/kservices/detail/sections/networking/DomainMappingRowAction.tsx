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

import { ActionButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useAuthorization } from '../../../../../hooks/useAuthorization';
import { ClusterDomainClaim, KnativeDomainMapping } from '../../../../../resources/knative';

interface DomainMappingRowActionProps {
  dm: KnativeDomainMapping;
  onAction: () => void;
}

/**
 * Row action component for DomainMapping that checks permissions before rendering.
 * This component checks both ClusterDomainClaim create and DomainMapping patch permissions.
 */
export function DomainMappingRowAction({ dm, onAction }: DomainMappingRowActionProps) {
  const cluster = dm.cluster;
  const namespace = dm.metadata.namespace;

  // Check ClusterDomainClaim create permission
  const canCreateCDC = useAuthorization({
    item: ClusterDomainClaim,
    authVerb: 'create',
    cluster,
  });

  // Check DomainMapping patch permission
  const canPatchDM = useAuthorization({
    item: KnativeDomainMapping,
    authVerb: 'patch',
    namespace,
    cluster,
  });

  // Only show if both permissions are granted
  if (canCreateCDC.allowed !== true || canPatchDM.allowed !== true) {
    return null;
  }

  return (
    <ActionButton
      description="Create ClusterDomainClaim"
      buttonStyle="menu"
      onClick={onAction}
      icon="mdi:plus-circle"
    />
  );
}
