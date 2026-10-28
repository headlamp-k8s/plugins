import { SectionBox, SimpleTable } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import type { ConditionRequirement } from '../../resources';

/**
 * Props for the RuleConditionsTable component.
 */
export interface RuleConditionsTableProps {
  /** List of condition requirements defined in the rule specification. */
  conditions?: ConditionRequirement[];
}

/**
 * Renders a structured Headlamp SimpleTable displaying required condition types,
 * expected status values ('True', 'False', 'Unknown'), and default fallback behaviors.
 *
 * @param props - Component props containing the list of condition requirements.
 * @returns Rendered SectionBox wrapping the conditions table.
 */
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
