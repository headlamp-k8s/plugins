import { DateLabel, Resource, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Chip } from '@mui/material';
import React from 'react';
import { useParams } from 'react-router-dom';
import { NodeReadinessRule } from '../../resources';
import { getRuleStats, resolveCrdErrorState } from '../../utils';
import { CrdNotInstalled, formatTaint, NodeSelectorDetails, NodeStatusChips } from '../common';
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
  const spec = rule?.spec;
  const status = rule?.status;
  if (!rule || !spec) return [];

  const { targeted, satisfied, unsatisfied, failed } = getRuleStats(rule);
  const enforcementMode = rule.enforcementMode;
  const isDryRun = rule.isDryRun;
  const conditionPolicy = rule.conditionPolicy;

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
      value: <Chip label={isDryRun ? 'Yes' : 'No'} size="small" variant="outlined" />,
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
  const [rule, ruleError] = NodeReadinessRule.useGet(name!);

  const crdErrorState = resolveCrdErrorState(!rule && ruleError ? [ruleError] : null, {
    resourceName: 'NodeReadinessRule',
    forbiddenTitle: 'Permission Denied: Cannot Read Node Readiness Rule',
    forbiddenDescription:
      'Your Kubernetes user or service account lacks read permissions for readiness.node.x-k8s.io/nodereadinessrules.',
    notFoundTitle: 'NodeReadinessRule Unavailable',
    notFoundDescription:
      'The requested NodeReadinessRule could not be found, or the NodeReadinessRule CRD is not installed on this cluster.',
  });

  if (crdErrorState) {
    return (
      <SectionBox title={name ? `NodeReadinessRule: ${name}` : 'Node Readiness Rule'}>
        <CrdNotInstalled
          isForbidden={crdErrorState.isForbidden}
          resourceName="NodeReadinessRule"
          title={crdErrorState.title}
          description={crdErrorState.description}
        />
      </SectionBox>
    );
  }

  return (
    <Resource.DetailsGrid
      resourceType={NodeReadinessRule}
      name={name!}
      noDefaultActions
      withEvents
      extraInfo={getRuleDetailSections}
      extraSections={(ruleItem: NodeReadinessRule | null) => {
        const spec = ruleItem?.spec;
        if (!ruleItem || !spec) return [];
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
