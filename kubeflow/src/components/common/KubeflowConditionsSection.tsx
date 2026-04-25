/**
 * Copyright 2025 The Headlamp Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  NameValueTable,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { KubeflowResourceCondition } from '../../resources/common';

interface KubeflowConditionsSectionProps {
  conditions: KubeflowResourceCondition[];
  title?: string;
}

/**
 * Renders a reusable conditions table for Kubeflow CRDs that expose `.status.conditions`.
 */
export function KubeflowConditionsSection({
  conditions,
  title = 'Conditions',
}: KubeflowConditionsSectionProps) {
  if (conditions.length === 0) {
    return null;
  }

  return (
    <SectionBox title={title}>
      <NameValueTable
        rows={conditions.map(condition => {
          return {
            name: condition.type ?? 'Condition',
            value: (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <StatusLabel
                  status={
                    condition.status === 'True'
                      ? 'success'
                      : condition.type === 'Failed' || condition.type?.includes('Error')
                      ? 'error'
                      : ''
                  }
                >
                  {condition.status ?? 'Unknown'}
                </StatusLabel>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {condition.reason ? `${condition.reason} — ` : ''}
                  {condition.message || ''}
                </Typography>
              </Box>
            ),
          };
        })}
      />
    </SectionBox>
  );
}
