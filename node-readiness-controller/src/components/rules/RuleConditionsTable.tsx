import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import type { ConditionRequirement } from '../../resources';

export interface RuleConditionsTableProps {
  conditions?: ConditionRequirement[];
}

export default function RuleConditionsTable({ conditions = [] }: RuleConditionsTableProps) {
  return (
    <SectionBox title="Conditions to Evaluate">
      <SimpleTable
        columns={[
          { label: 'Condition Type', getter: (c: ConditionRequirement) => c.type },
          {
            label: 'Required Status',
            getter: (c: ConditionRequirement) => c.requiredStatus,
          },
          {
            label: 'Default Status',
            getter: (c: ConditionRequirement) => c.defaultStatus || 'Unknown',
          },
        ]}
        data={conditions}
        emptyMessage="No conditions defined."
      />
    </SectionBox>
  );
}
