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

import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Tooltip, Typography } from '@mui/material';
import type { Condition } from '../../resources/knative/common';
import { getAge } from '../../utils/time';
import { ReadyStatusLabel } from './ReadyStatusLabel';

type ConditionsSectionProps = {
  conditions: Condition[];
};

export default function ConditionsSection({ conditions }: ConditionsSectionProps) {
  const columns = [
    {
      label: 'Type',
      getter: (c: Condition) => c.type,
      sort: (a: Condition, b: Condition) => a.type.localeCompare(b.type),
    },
    {
      label: 'Status',
      getter: (c: Condition) => (
        <ReadyStatusLabel
          status={c.status}
          reason={c.reason}
          message={c.message}
          isReadyType={c.type === 'Ready'}
        />
      ),
      sort: (a: Condition, b: Condition) => a.status.localeCompare(b.status),
    },
    {
      label: 'Reason',
      getter: (c: Condition) => c.reason || '-',
      sort: (a: Condition, b: Condition) => (a.reason || '').localeCompare(b.reason || ''),
    },
    {
      label: 'Message',
      getter: (c: Condition) =>
        c.message ? (
          <Tooltip title={c.message}>
            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 400 }}>
              {c.message}
            </Typography>
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 400 }}>
            -
          </Typography>
        ),
    },
    {
      label: 'Last Transition',
      getter: (c: Condition) => (c.lastTransitionTime ? getAge(c.lastTransitionTime) : '-'),
      sort: (a: Condition, b: Condition) => {
        const timeA = a.lastTransitionTime ? new Date(a.lastTransitionTime).getTime() : 0;
        const timeB = b.lastTransitionTime ? new Date(b.lastTransitionTime).getTime() : 0;
        return timeA - timeB;
      },
    },
  ];

  return (
    <SectionBox title="Conditions">
      <SimpleTable columns={columns} data={conditions} />
    </SectionBox>
  );
}
