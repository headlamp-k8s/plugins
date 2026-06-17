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
import { NameValueTable, SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import {
  DeletingPolicy,
  GeneratingPolicy,
  MutatingPolicy,
  ValidatingPolicy,
} from '../resources/celPolicies';

type CELPolicy = ValidatingPolicy | MutatingPolicy | GeneratingPolicy | DeletingPolicy;

interface CELPolicyViewerProps {
  policy: CELPolicy;
}

function ReadyChip({ ready }: { ready: boolean }) {
  return <Chip label={ready ? 'True' : 'False'} color={ready ? 'success' : 'error'} size="small" />;
}

function JsonBlock({ data }: { data: any }) {
  if (!data || (Array.isArray(data) && data.length === 0) || Object.keys(data).length === 0) {
    return null;
  }
  return (
    <pre
      style={{
        overflowX: 'auto',
        padding: '1rem',
        background: 'var(--mui-palette-background-paper)',
        borderRadius: '4px',
        border: '1px solid var(--mui-palette-divider)',
        margin: 0,
      }}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function ArrayTableSection({
  title,
  data,
  columns,
}: {
  title: string;
  data: any[];
  columns: { label: string; getter: (item: any) => any }[];
}) {
  if (!data || data.length === 0) {
    return null; // Don't render empty sections
  }

  return (
    <SectionBox title={title} sx={{ mt: 2 }}>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((col, i) => (
                <TableCell key={i} sx={{ fontWeight: 'bold' }}>
                  {col.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row, i) => (
              <TableRow key={i}>
                {columns.map((col, j) => (
                  <TableCell key={j}>
                    <Box
                      sx={{
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {col.getter(row) || '-'}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </SectionBox>
  );
}

function MatchConstraintsSection({ constraints }: { constraints: any }) {
  const { t } = useTranslation();
  if (!constraints) return null;

  const hasResourceRules = constraints.resourceRules && constraints.resourceRules.length > 0;
  const remainingConstraints = { ...constraints };
  delete remainingConstraints.resourceRules;
  const hasRemaining = Object.keys(remainingConstraints).length > 0;

  return (
    <SectionBox title={t('Match Constraints')} sx={{ mt: 2 }}>
      {hasResourceRules && (
        <Box sx={{ mb: hasRemaining ? 2 : 0 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
            {t('Resource Rules')}
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('API Groups')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('API Versions')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('Operations')}</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>{t('Resources')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {constraints.resourceRules.map((rule: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Box sx={{ fontFamily: 'monospace' }}>
                        {rule.apiGroups?.join(', ') || '*'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ fontFamily: 'monospace' }}>
                        {rule.apiVersions?.join(', ') || '*'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ fontFamily: 'monospace' }}>
                        {rule.operations?.join(', ') || '*'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ fontFamily: 'monospace' }}>
                        {rule.resources?.join(', ') || '*'}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {hasRemaining && (
        <Box>
          {hasResourceRules && (
            <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
              {t('Other Constraints')}
            </Typography>
          )}
          <JsonBlock data={remainingConstraints} />
        </Box>
      )}
    </SectionBox>
  );
}

export function CELPolicyViewer({ policy }: CELPolicyViewerProps) {
  const { t } = useTranslation();

  const getSpecificDetails = () => {
    if (policy instanceof ValidatingPolicy) {
      return [
        { name: t('Validation Actions'), value: policy.validationActions.join(', ') || '-' },
        { name: t('Validations'), value: policy.validationCount.toString() },
      ];
    }
    if (policy instanceof MutatingPolicy) {
      return [{ name: t('Mutations'), value: policy.mutationCount.toString() }];
    }
    if (policy instanceof GeneratingPolicy) {
      return [{ name: t('Generators'), value: policy.generateCount.toString() }];
    }
    if (policy instanceof DeletingPolicy) {
      return [{ name: t('Schedule'), value: policy.schedule }];
    }
    return [];
  };

  const rows = [
    { name: t('Name'), value: policy.jsonData.metadata.name },
    { name: t('Kind'), value: policy.jsonData.kind },
    { name: t('Ready'), value: <ReadyChip ready={policy.ready} /> },
    ...getSpecificDetails(),
    {
      name: t('Created'),
      value: new Date(policy.jsonData.metadata.creationTimestamp).toLocaleString(),
    },
  ];

  const spec = policy.spec;

  return (
    <Box sx={{ p: 2 }}>
      <SectionBox title={t('Overview')}>
        <NameValueTable rows={rows} />
      </SectionBox>

      <MatchConstraintsSection constraints={spec?.matchConstraints} />

      {spec?.variables && (
        <ArrayTableSection
          title={t('Variables')}
          data={spec.variables}
          columns={[
            { label: t('Name'), getter: i => i.name },
            { label: t('Expression'), getter: i => i.expression },
          ]}
        />
      )}

      {policy instanceof ValidatingPolicy && policy.spec.validations && (
        <ArrayTableSection
          title={t('Validations')}
          data={policy.spec.validations}
          columns={[
            { label: t('Expression'), getter: i => i.expression },
            { label: t('Message'), getter: i => i.message || i.messageExpression },
            { label: t('Reason'), getter: i => i.reason },
          ]}
        />
      )}

      {policy instanceof ValidatingPolicy && policy.spec.auditAnnotations && (
        <ArrayTableSection
          title={t('Audit Annotations')}
          data={policy.spec.auditAnnotations}
          columns={[
            { label: t('Key'), getter: i => i.key },
            { label: t('Value Expression'), getter: i => i.valueExpression },
          ]}
        />
      )}

      {policy instanceof MutatingPolicy && policy.spec.mutations && (
        <ArrayTableSection
          title={t('Mutations')}
          data={policy.spec.mutations}
          columns={[
            { label: t('Patch Type'), getter: i => i.patchType || 'JSONPatch' },
            {
              label: t('Expression'),
              getter: i => i.applyConfiguration?.expression || i.rfc6902?.expression,
            },
          ]}
        />
      )}

      {policy instanceof GeneratingPolicy && policy.spec.generate && (
        <ArrayTableSection
          title={t('Generators')}
          data={policy.spec.generate}
          columns={[
            { label: t('Expression'), getter: i => i.expression },
            { label: t('Name'), getter: i => i.name },
            { label: t('Namespace'), getter: i => i.namespace },
          ]}
        />
      )}

      {policy instanceof DeletingPolicy && policy.spec.conditions && (
        <SectionBox title={t('Conditions')} sx={{ mt: 2 }}>
          <JsonBlock data={policy.spec.conditions} />
        </SectionBox>
      )}
    </Box>
  );
}
