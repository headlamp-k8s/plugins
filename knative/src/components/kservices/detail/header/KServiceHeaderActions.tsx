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
import { KService } from '../../../../resources/knative';
import { useKServiceActions } from '../hooks/useKServiceActions';
import { useKServicePermissions } from '../permissions/KServicePermissionsProvider';

type KServiceHeaderActionsProps = {
  kservice: KService;
};

export function KServiceHeaderActions({ kservice }: KServiceHeaderActionsProps) {
  const { acting, handleRedeploy, handleRestart } = useKServiceActions(kservice);
  const disabled = acting !== null;
  const { canPatchKService, canDeletePods } = useKServicePermissions();

  return (
    <>
      {canPatchKService === true && (
        <ActionButton
          description="Redeploy Latest Revision"
          icon="mdi:update"
          onClick={handleRedeploy}
          iconButtonProps={{ disabled }}
        />
      )}
      {canDeletePods === true && (
        <ActionButton
          description="Restart"
          icon="mdi:restart"
          onClick={handleRestart}
          iconButtonProps={{ disabled }}
        />
      )}
    </>
  );
}
