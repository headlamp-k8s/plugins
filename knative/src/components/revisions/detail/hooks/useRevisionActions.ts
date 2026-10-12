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

import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { useSnackbar } from 'notistack';
import { KRevision, KService } from '../../../../resources/knative';

export function useRevisionActions() {
  const { t } = useTranslation();
  const { enqueueSnackbar } = useSnackbar();

  const isSafeToDelete = (revision: KRevision, kservice: KService | null) => {
    if (!kservice) return { safe: true };

    const traffic = revision.getTrafficInService(kservice);
    const hasActiveTraffic = traffic.some(item => (item.percent || 0) > 0 || !!item.tag);

    if (hasActiveTraffic) {
      return {
        safe: false,
        reason: t('Revision is currently receiving traffic or has an assigned tag.'),
      };
    }

    return { safe: true };
  };

  const deleteRevision = async (revision: KRevision, kservice: KService | null) => {
    const { safe, reason } = isSafeToDelete(revision, kservice);
    if (!safe) {
      enqueueSnackbar(reason, { variant: 'error' });
      return;
    }

    try {
      await revision.delete();
      enqueueSnackbar(
        t('Successfully deleted Revision {{ name }}!', { name: revision.metadata.name }),
        {
          variant: 'success',
        }
      );
    } catch (err) {
      const errMessage = err instanceof Error ? err.message : String(err);
      enqueueSnackbar(
        t('Failed to delete Revision {{ name }}: {{ error }}', {
          name: revision.metadata.name,
          error: errMessage,
        }),
        {
          variant: 'error',
        }
      );
    }
  };

  return { deleteRevision, isSafeToDelete };
}
