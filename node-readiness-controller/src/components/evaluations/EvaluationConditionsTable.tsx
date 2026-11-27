import {
  DateLabel,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Typography } from '@mui/material';
import React from 'react';
import type { NodeReadinessEvaluationCondition } from '../../resources';

export interface EvaluationConditionsTableProps {
  /** Array of status observation conditions for this evaluation. */
  conditions?: NodeReadinessEvaluationCondition[];
}

/**
 * Renders observation lifecycle conditions (e.g., 'Evaluated', 'Available')
 * reported in status.conditions of a NodeReadinessEvaluation.
 */
export default function EvaluationConditionsTable({
  conditions = [],
}: EvaluationConditionsTableProps) {
  if (conditions.length === 0) {
    return null;
  }

  return (
    <SectionBox title="Observation Conditions">
      <SimpleTable
        columns={[
          {
            label: 'Condition',
            getter: (c: NodeReadinessEvaluationCondition) => c.type,
          },
          {
            label: 'Status',
            getter: (c: NodeReadinessEvaluationCondition) => {
              const statusSeverity =
                c.status === 'True' ? 'success' : c.status === 'False' ? 'error' : 'warning';
              return <StatusLabel status={statusSeverity}>{c.status}</StatusLabel>;
            },
          },
          {
            label: 'Reason',
            getter: (c: NodeReadinessEvaluationCondition) => c.reason || '—',
          },
          {
            label: 'Message',
            getter: (c: NodeReadinessEvaluationCondition) => (
              <Typography variant="body2" color="text.secondary">
                {c.message || '—'}
              </Typography>
            ),
          },
          {
            label: 'Last Transition',
            getter: (c: NodeReadinessEvaluationCondition) =>
              c.lastTransitionTime ? (
                <DateLabel date={c.lastTransitionTime} />
              ) : (
                <Typography variant="caption" color="text.secondary">
                  —
                </Typography>
              ),
          },
        ]}
        data={conditions}
        emptyMessage="No conditions recorded."
      />
    </SectionBox>
  );
}
