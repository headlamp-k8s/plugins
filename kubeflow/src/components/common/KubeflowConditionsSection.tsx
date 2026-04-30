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

import { Utils } from '@kinvolk/headlamp-plugin/lib';
import {
  DateLabel,
  HoverInfoLabel,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeflowResourceCondition } from '../../resources/common';

interface KubeflowConditionsSectionProps {
  conditions: KubeflowResourceCondition[];
  title?: string;
}

function ConditionDateLabel({ date }: { date?: string }) {
  if (!date) {
    return '-';
  }

  const parsedDate = Date.parse(date);
  if (Number.isNaN(parsedDate)) {
    return '-';
  }

  if (parsedDate > Date.now() + 1000) {
    const formattedDate = Utils.localeDate(date);
    return <HoverInfoLabel label={formattedDate} hoverInfo={formattedDate} icon="mdi:calendar" />;
  }

  return <DateLabel date={date} />;
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
      <SimpleTable
        data={conditions}
        columns={[
          {
            label: 'Condition',
            getter: (condition: KubeflowResourceCondition) => (
              <StatusLabel>{condition.type ?? 'Condition'}</StatusLabel>
            ),
          },
          {
            label: 'Status',
            getter: (condition: KubeflowResourceCondition) => condition.status ?? 'Unknown',
          },
          {
            label: 'Last Transition',
            getter: (condition: KubeflowResourceCondition) => (
              <ConditionDateLabel date={condition.lastTransitionTime} />
            ),
          },
          {
            label: 'Last Update',
            getter: (condition: KubeflowResourceCondition) => (
              <ConditionDateLabel date={condition.lastUpdateTime} />
            ),
          },
          {
            label: 'Reason',
            getter: (condition: KubeflowResourceCondition) =>
              condition.reason ? (
                <HoverInfoLabel label={condition.reason} hoverInfo={condition.message} />
              ) : (
                '-'
              ),
          },
        ]}
      />
    </SectionBox>
  );
}
