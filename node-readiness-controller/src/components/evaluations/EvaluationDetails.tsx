import {
  DateLabel,
  Link,
  Resource,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Chip, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { NodeReadinessEvaluation } from '../../resources';
import {
  getActiveTaints,
  getEvaluationStateInfo,
  getEvaluationSummary,
  resolveCrdErrorState,
} from '../../utils';
import { useCanGetNodes } from '../../utils/useCanGetNodes';
import { CrdNotInstalled } from '../common';
import type { RuleDetailSectionItem } from '../rules/RuleDetails';
import EvaluationConditionsTable from './EvaluationConditionsTable';
import EvaluationRuleTable from './EvaluationRuleTable';

/**
 * Computes custom key-value detail sections for Headlamp's Resource.DetailsGrid,
 * including Target Node link, Readiness State, Rule satisfaction summary,
 * active NRC taints, and Last Evaluated timestamp.
 *
 * @param evaluation - The NodeReadinessEvaluation instance to extract sections for, or null if loading.
 * @param canViewNode - Whether the current user holds RBAC `get` permission on Kubernetes nodes.
 * @returns Array of section name-value pairs for the details grid.
 */
export function getEvaluationDetailSections(
  evaluation: NodeReadinessEvaluation | null,
  canViewNode = true
): RuleDetailSectionItem[] {
  if (!evaluation) return [];

  const nodeName = evaluation.nodeName || evaluation.metadata?.name || '';
  const stateInfo = getEvaluationStateInfo(evaluation.state);
  const summary = getEvaluationSummary(evaluation);
  const rules = evaluation.rules;

  // Collect present taints from rule evaluations (de-duplicated across rules)
  const presentTaints = getActiveTaints(rules);

  // Find latest valid evaluation timestamp
  const latestEvaluation = rules.reduce<string | undefined>((latest, r) => {
    const ts = r?.lastEvaluatedAt;
    if (!ts) {
      return latest;
    }
    const parsedTs = Date.parse(ts);
    if (Number.isNaN(parsedTs)) {
      return latest;
    }
    if (!latest) {
      return ts;
    }
    const parsedLatest = Date.parse(latest);
    return Number.isNaN(parsedLatest) || parsedTs > parsedLatest ? ts : latest;
  }, undefined);

  return [
    {
      name: 'Target Node',
      value: canViewNode ? (
        <Link
          routeName="node"
          params={{ name: nodeName }}
          activeCluster={evaluation.cluster}
          aria-label={`View target Kubernetes node ${nodeName}`}
        >
          View Node ({nodeName})
        </Link>
      ) : (
        <Typography variant="body2">{nodeName}</Typography>
      ),
    },
    {
      name: 'Readiness State',
      value: (
        <span aria-label={`Readiness State: ${stateInfo.label}`}>
          <StatusLabel status={stateInfo.severity}>{stateInfo.label}</StatusLabel>
        </span>
      ),
    },
    {
      name: 'Rules Progress',
      value: summary.isPending ? (
        <StatusLabel status={summary.statusSeverity}>{summary.statusLabel}</StatusLabel>
      ) : (
        <Box
          sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}
          role="group"
          aria-label={`Rules progress: ${summary.satisfied} of ${summary.total} satisfied, ${summary.unsatisfied} unsatisfied`}
        >
          <Chip
            label={`Total: ${summary.total}`}
            size="small"
            variant="outlined"
            aria-label={`Total rules: ${summary.total}`}
          />
          <Chip
            label={`Satisfied: ${summary.satisfied}`}
            size="small"
            color="success"
            aria-label={`Satisfied rules: ${summary.satisfied}`}
          />
          <Chip
            label={`Unsatisfied: ${summary.unsatisfied}`}
            size="small"
            color={summary.unsatisfied > 0 ? 'warning' : 'default'}
            aria-label={`Unsatisfied rules: ${summary.unsatisfied}`}
          />
        </Box>
      ),
    },
    {
      name: 'Active NRC Taints',
      value:
        presentTaints.length > 0 ? (
          <Box
            sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}
            role="group"
            aria-label="Active NRC taints"
          >
            {presentTaints.map(t => (
              <Chip
                key={t}
                label={t}
                size="small"
                color="warning"
                aria-label={`Active taint: ${t}`}
              />
            ))}
          </Box>
        ) : (
          'None'
        ),
    },
    {
      name: 'Last Evaluated At',
      value: latestEvaluation ? <DateLabel date={latestEvaluation} /> : '—',
    },
  ];
}

/**
 * Detailed inspector view component for an individual NodeReadinessEvaluation resource.
 * Renders Headlamp's DetailsGrid with node linkage, overall readiness state,
 * rules summary, active taints, expandable rule evaluations, and observation conditions.
 *
 * @returns Rendered JSX DetailsGrid component.
 */
export default function EvaluationDetails() {
  const { name } = useParams<{ name: string }>();
  const [evaluation, evaluationError] = NodeReadinessEvaluation.useGet(name!);
  const authTargets = useMemo(
    () =>
      evaluation
        ? [
            {
              cluster: evaluation.cluster,
              nodeName: evaluation.nodeName || evaluation.metadata?.name || '',
            },
          ]
        : [],
    [evaluation]
  );
  const { canGetNode } = useCanGetNodes(authTargets);

  const crdErrorState = resolveCrdErrorState(
    !evaluation && evaluationError ? [evaluationError] : null,
    {
      resourceName: 'NodeReadinessEvaluation',
      forbiddenTitle: 'Permission Denied: Cannot Read Node Readiness Evaluation',
      forbiddenDescription:
        'Your Kubernetes user or service account lacks read permissions for readiness.node.x-k8s.io/nodereadinessevaluations.',
      notFoundTitle: 'NodeReadinessEvaluation Unavailable',
      notFoundDescription:
        'The requested NodeReadinessEvaluation could not be found, or the NodeReadinessEvaluation CRD is not installed on this cluster (requires v0.7.0+ with NRE support enabled).',
    }
  );

  if (crdErrorState) {
    return (
      <SectionBox title={name ? `NodeReadinessEvaluation: ${name}` : 'Node Readiness Evaluation'}>
        <CrdNotInstalled
          isForbidden={crdErrorState.isForbidden}
          resourceName="NodeReadinessEvaluation"
          title={crdErrorState.title}
          description={crdErrorState.description}
        />
      </SectionBox>
    );
  }

  return (
    <Resource.DetailsGrid
      resourceType={NodeReadinessEvaluation}
      name={name!}
      title={name ? `NodeReadinessEvaluation: ${name}` : undefined}
      noDefaultActions
      extraInfo={(evalItem: NodeReadinessEvaluation | null) =>
        getEvaluationDetailSections(
          evalItem,
          canGetNode(evalItem?.cluster, evalItem?.nodeName || evalItem?.metadata?.name)
        )
      }
      extraSections={(evalItem: NodeReadinessEvaluation | null) => {
        if (!evalItem) return [];
        const sections = [
          {
            id: 'nrc-evaluation-rules',
            section: (
              <EvaluationRuleTable rules={evalItem.rules} activeCluster={evalItem.cluster} />
            ),
          },
        ];

        const conditions = evalItem.status?.conditions || [];
        if (conditions.length > 0) {
          sections.push({
            id: 'nrc-evaluation-conditions',
            section: <EvaluationConditionsTable conditions={conditions} />,
          });
        }

        return sections;
      }}
    />
  );
}
