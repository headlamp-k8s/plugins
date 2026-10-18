import { DateLabel, Resource, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Chip } from '@mui/material';
import React from 'react';
import { useParams } from 'react-router-dom';
import { NodeReadinessRule } from '../../resources';
import { getRuleStats } from '../../utils';
import { formatTaint, NodeSelectorDetails, NodeStatusChips } from '../common';
import DryRunResultsSection from './DryRunResultsSection';
import RuleConditionsTable from './RuleConditionsTable';

/**
 * Section item structure expected by Headlamp's DetailsGrid extraInfo.
 */
export interface RuleDetailSectionItem {
  /** Name/label of the detail field. */
  name: React.ReactNode;
  /** Value content of the detail field. */
  value: React.ReactNode;
}

/**
 * Computes custom key-value detail sections for Headlamp's Resource.DetailsGrid,
 * including Node Selector, Enforcement Mode, Dry-Run flag, Condition Policy, Managed Taint,
 * Last Evaluated timestamp, and Node Status / Simulation summary.
 *
 * @param rule - The NodeReadinessRule instance to extract sections for, or null if loading.
 * @returns Array of section name-value pairs for the details grid.
 */
export function getRuleDetailSections(rule: NodeReadinessRule | null): RuleDetailSectionItem[] {
  const spec = rule?.spec ?? rule?.jsonData?.spec;
  const status = rule?.status ?? rule?.jsonData?.status;
  if (!rule || !spec) return [];

  const { targeted, satisfied, unsatisfied, failed } = getRuleStats(rule);
  const enforcementMode = rule.enforcementMode ?? (spec.enforcementMode || 'continuous');
  const isDryRun = rule.isDryRun ?? Boolean(spec.dryRun);
  const conditionPolicy = rule.conditionPolicy ?? (spec.conditionPolicy || 'allOf');

  const sections: RuleDetailSectionItem[] = [
    {
      name: 'Node Selector',
      value:
        spec.nodeSelector?.matchLabels || spec.nodeSelector?.matchExpressions ? (
          <NodeSelectorDetails selector={spec.nodeSelector} />
        ) : (
          'None (Matches all nodes)'
        ),
    },
    {
      name: <span style={{ whiteSpace: 'nowrap' }}>Enforcement Mode</span>,
      value: <Chip label={enforcementMode} size="small" variant="outlined" />,
    },
    {
      name: 'Dry-run',
      value: isDryRun ? (
        <StatusLabel status="warning" sx={{ fontSize: '0.8125rem', py: 0.25 }}>
          Yes
        </StatusLabel>
      ) : (
        <StatusLabel status="success" sx={{ fontSize: '0.8125rem', py: 0.25 }}>
          No
        </StatusLabel>
      ),
    },
    {
      name: 'Condition Policy',
      value: conditionPolicy,
    },
    {
      name: 'Taint Managed',
      value: spec.taint ? formatTaint(spec.taint) : 'None',
    },
    {
      name: 'Last Evaluated At',
      value: (() => {
        if (isDryRun) {
          return 'Not Available (Dry Run)';
        }
        const records = [...(status?.nodeEvaluations ?? []), ...(status?.failedNodes ?? [])];
        const lastEvaluatedAt = records.reduce<string | undefined>((latest, item) => {
          const timestamp = item?.lastEvaluationTime;
          return !timestamp || (latest && Date.parse(latest) >= Date.parse(timestamp))
            ? latest
            : timestamp;
        }, undefined);
        return lastEvaluatedAt ? <DateLabel date={lastEvaluatedAt} /> : 'Pending';
      })(),
    },
  ];

  if (isDryRun) {
    sections.push({
      name: 'Dry-Run Simulation',
      value: status?.dryRunResults ? (
        <DryRunResultsSection results={status.dryRunResults} failed={failed} />
      ) : (
        'Pending simulation'
      ),
    });
  } else {
    sections.push({
      name: 'Node Status',
      value: (
        <NodeStatusChips
          targeted={targeted}
          satisfied={satisfied}
          unsatisfied={unsatisfied}
          failed={failed}
        />
      ),
    });
  }

  return sections;
}

/**
 * Detailed inspector view component for an individual NodeReadinessRule resource.
 * Renders Headlamp's DetailsGrid with rule configuration, status chips, conditions table, and events.
 *
 * @returns Rendered JSX DetailsGrid component.
 */
export default function RuleDetails() {
  const { name } = useParams<{ name: string }>();

  return (
    <Resource.DetailsGrid
      resourceType={NodeReadinessRule}
      name={name!}
      noDefaultActions
      withEvents
      extraInfo={getRuleDetailSections}
      extraSections={(rule: NodeReadinessRule | null) => {
        const spec = rule?.spec ?? rule?.jsonData?.spec;
        if (!rule || !spec) return [];
        return [
          {
            id: 'nrc-conditions',
            section: <RuleConditionsTable conditions={spec.conditions} />,
          },
        ];
      }}
    />
  );
}
