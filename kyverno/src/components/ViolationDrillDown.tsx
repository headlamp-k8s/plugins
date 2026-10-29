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
import CloseIcon from '@mui/icons-material/Close';
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Typography,
} from '@mui/material';
import { ReactNode } from 'react';
import { CELValidation, ValidatingPolicy, ValidatingPolicySpec } from '../resources/celPolicies';
import { KyvernoClusterPolicy, KyvernoPolicy, PolicyRule } from '../resources/kyvernoPolicy';
import {
  describeCELMatchReasons,
  describeMatchReasons,
  DrillDownTarget,
  suggestCELFix,
  suggestFix,
} from '../resources/policyImpact';
import { POLICY_REPORT_SOURCE } from '../resources/policyReport';
import { ResultStatusChip, SeverityChip } from './common';

export interface ViolationDrillDownProps {
  target: DrillDownTarget | null;
  onClose: () => void;
  // Pre-fetched rules when the caller (PolicyImpactPanel) already has the policy object.
  rules?: PolicyRule[];
}

export function ViolationDrillDown({ target, onClose, rules }: ViolationDrillDownProps) {
  const { t } = useTranslation();
  const open = target !== null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      aria-labelledby="violation-drilldown-title"
    >
      <DialogTitle id="violation-drilldown-title" sx={{ pr: 6 }}>
        {t('Violation Details')}
        <IconButton
          aria-label={t('Close')}
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
          size="small"
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {open && <DrillDownContent target={target} rules={rules} />}
      </DialogContent>
    </Dialog>
  );
}

// Inner dispatcher: routes to the right data-fetching sub-component based on
// whether rules are pre-fetched and what engine produced this result.
function DrillDownContent({ target, rules }: { target: DrillDownTarget; rules?: PolicyRule[] }) {
  if (rules) {
    return <LegacyContent target={target} rules={rules} />;
  }

  const source = target.source;
  if (source === POLICY_REPORT_SOURCE.validating) {
    return <CELFetchContent target={target} />;
  }
  if (source === POLICY_REPORT_SOURCE.legacy) {
    // A namespaced Policy encodes its identity as "namespace/name" in result.policy;
    // a ClusterPolicy is just "name". Same encoding Kyverno uses in PolicyReportResult,
    // confirmed against the existing collectPolicyImpact logic in policyImpact.ts.
    const parts = target.policy.split('/');
    if (parts.length >= 2) {
      const ns = parts.slice(0, -1).join('/');
      const name = parts[parts.length - 1];
      return <NamespacedLegacyFetch target={target} name={name} namespace={ns} />;
    }
    return <ClusterLegacyFetch target={target} name={target.policy} />;
  }

  // For mutating/generating/imageValidating sources and unknown sources:
  // we don't have a matching policy viewer yet, show the available info.
  return <BasicContent target={target} />;
}

// Fetches a ClusterPolicy to extract its rules.
function ClusterLegacyFetch({ target, name }: { target: DrillDownTarget; name: string }) {
  const [policy, error] = KyvernoClusterPolicy.useGet(name);
  if (error) return <BasicContent target={target} />;
  if (!policy) return <LoadingPlaceholder />;
  return <LegacyContent target={target} rules={policy.rules} />;
}

// Fetches a namespaced Policy to extract its rules.
function NamespacedLegacyFetch({
  target,
  name,
  namespace,
}: {
  target: DrillDownTarget;
  name: string;
  namespace: string;
}) {
  const [policy, error] = KyvernoPolicy.useGet(name, namespace);
  if (error) return <BasicContent target={target} />;
  if (!policy) return <LoadingPlaceholder />;
  return <LegacyContent target={target} rules={policy.rules} />;
}

// Fetches a CEL ValidatingPolicy to extract its spec.
function CELFetchContent({ target }: { target: DrillDownTarget }) {
  const [policy, error] = ValidatingPolicy.useGet(target.policy);
  if (error) return <BasicContent target={target} />;
  if (!policy) return <LoadingPlaceholder />;
  return <CELContent target={target} spec={policy.spec} />;
}

function LoadingPlaceholder() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <CircularProgress size={28} />
    </Box>
  );
}

// Renders match reasons and fix suggestion for a legacy kyverno.io/v1 policy.
function LegacyContent({ target, rules }: { target: DrillDownTarget; rules: PolicyRule[] }) {
  const { t } = useTranslation();
  const kind = target.kind || 'Unknown';
  const reasons = describeMatchReasons(rules, kind);
  const matchingRule = rules.find(r => r.name === target.rule) ?? rules[0];
  const fix = matchingRule ? suggestFix(matchingRule, target) : undefined;

  return (
    <>
      <TargetSummary target={target} />
      <Divider sx={{ my: 2 }} />
      <Section title={t('Why this resource was evaluated')}>
        {reasons.map((r, i) => (
          <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
            {r}
          </Typography>
        ))}
      </Section>
      {fix && (
        <>
          <Divider sx={{ my: 2 }} />
          <Section title={t('Suggested fix')}>
            <Typography variant="body2">{fix}</Typography>
          </Section>
        </>
      )}
    </>
  );
}

// Renders match reasons and fix suggestion for a CEL ValidatingPolicy.
function CELContent({ target, spec }: { target: DrillDownTarget; spec: ValidatingPolicySpec }) {
  const { t } = useTranslation();
  const kind = target.kind || 'Unknown';
  const reasons = describeCELMatchReasons(spec, kind);

  // Find the matching validation entry by message. Falls back to the first one when
  // no message matches exactly (e.g. when the policy uses messageExpression instead).
  const matchingValidation: CELValidation | undefined =
    spec.validations?.find(v => v.message && target.message?.includes(v.message)) ??
    spec.validations?.[0];

  const fix = matchingValidation ? suggestCELFix(matchingValidation, target) : undefined;

  return (
    <>
      <TargetSummary target={target} />
      <Divider sx={{ my: 2 }} />
      <Section title={t('Why this resource was evaluated')}>
        {reasons.map((r, i) => (
          <Typography key={i} variant="body2" sx={{ mb: 0.5 }}>
            {r}
          </Typography>
        ))}
      </Section>
      {matchingValidation && (
        <>
          <Divider sx={{ my: 2 }} />
          <Section title={t('Suggested fix')}>
            {fix && (
              <Typography variant="body2" sx={{ mb: 1 }}>
                {fix}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              {t('CEL expression')}
            </Typography>
            <Box
              component="pre"
              sx={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                bgcolor: 'action.hover',
                borderRadius: 1,
                p: 1,
                mt: 0.5,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {matchingValidation.expression}
            </Box>
          </Section>
        </>
      )}
    </>
  );
}

// Minimal fallback: just the target summary and message. Used when the policy
// object can't be fetched or the source type has no dedicated viewer yet.
function BasicContent({ target }: { target: DrillDownTarget }) {
  const { t } = useTranslation();
  return (
    <>
      <TargetSummary target={target} />
      {!target.message && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            {t('No additional details available for this violation.')}
          </Typography>
        </>
      )}
    </>
  );
}

// Resource identity + status header rendered at the top of every content variant.
function TargetSummary({ target }: { target: DrillDownTarget }) {
  const { t } = useTranslation();
  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
        <ResultStatusChip status={target.status} />
        {target.severity && <SeverityChip severity={target.severity} />}
      </Box>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: '4px 12px',
          alignItems: 'baseline',
        }}
      >
        {target.kind && <InfoPair label={t('Kind')} value={target.kind} />}
        {target.name && <InfoPair label={t('Resource')} value={target.name} />}
        {target.namespace && <InfoPair label={t('Namespace')} value={target.namespace} />}
        <InfoPair label={t('Policy')} value={target.policy} />
        {target.rule && <InfoPair label={t('Rule')} value={target.rule} />}
      </Box>
      {target.message && (
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            {t('Message')}
          </Typography>
          <Typography variant="body2">{target.message}</Typography>
        </Box>
      )}
    </Box>
  );
}

function InfoPair({ label, value }: { label: string; value: string }) {
  return (
    <>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value}</Typography>
    </>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}
