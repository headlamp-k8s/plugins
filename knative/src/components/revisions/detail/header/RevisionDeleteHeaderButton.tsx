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
import { KRevision, KService } from '../../../../resources/knative';
import { useRevisionActions } from '../hooks/useRevisionActions';
import { useRevisionPermissions } from '../permissions/RevisionPermissionsProvider';

export function RevisionDeleteHeaderButton({ revision }: { revision: KRevision }) {
  const { deleteRevision, isSafeToDelete } = useRevisionActions();
  const { canDeleteRevision } = useRevisionPermissions();

  const [kservice] = KService.useGet(
    revision.parentService || '',
    revision.metadata.namespace || '',
    { cluster: revision.cluster }
  );

  // Hide the button when the user does not have delete permission.
  if (canDeleteRevision !== true) {
    return null;
  }

  const hasParentService = !!revision.parentService;
  const isLoadingKService = hasParentService && typeof kservice === 'undefined';

  let { safe, reason } = isSafeToDelete(revision, kservice ?? null);

  if (isLoadingKService) {
    safe = false;
    reason = 'Loading Traffic...';
  }

  return (
    <ActionButton
      description={safe ? 'Delete Revision' : reason}
      icon="mdi:delete"
      onClick={() => deleteRevision(revision, kservice ?? null)}
      iconButtonProps={{ disabled: !safe }}
    />
  );
}
