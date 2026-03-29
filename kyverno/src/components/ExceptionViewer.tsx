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
import { NameValueTable, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Chip, CircularProgress, Typography } from '@mui/material';
import { PolicyException, PolicyExceptionEntry } from '../resources/policyException';

interface ExceptionViewerProps {
  name: string;
  namespace?: string;
}

function MatchSection({ match }: { match: PolicyException['spec']['match'] }) {
  const { t } = useTranslation();
  const selectors = match?.any || match?.all || [];
  if (selectors.length === 0) return null;

  const matchType = match?.any ? t('Any (OR)') : t('All (AND)');

  return (
    <SectionBox title={t('Match Conditions ({{type}})', { type: matchType })}>
      {selectors.map((selector, i) => {
        const resources = selector.resources;
        const subjects = selector.subjects;

        return (
          <Box key={i} sx={{ mb: 1 }}>
            {resources?.kinds && (
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                  {t('Kinds:')}
                </Typography>
                {resources.kinds.map(k => (
                  <Chip key={k} label={k} size="small" variant="outlined" />
                ))}
              </Box>
            )}
            {resources?.names && (
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                  {t('Names:')}
                </Typography>
                {resources.names.map(n => (
                  <Chip key={n} label={n} size="small" variant="outlined" />
                ))}
              </Box>
            )}
            {resources?.namespaces && (
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                  {t('Namespaces:')}
                </Typography>
                {resources.namespaces.map(n => (
                  <Chip key={n} label={n} size="small" variant="outlined" />
                ))}
              </Box>
            )}
            {subjects && subjects.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', mb: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mr: 1 }}>
                  {t('Subjects:')}
                </Typography>
                {subjects.map((s, j) => (
                  <Chip key={j} label={`${s.kind}/${s.name}`} size="small" variant="outlined" />
                ))}
              </Box>
            )}
          </Box>
        );
      })}
    </SectionBox>
  );
}

function ExceptionContent({ exception }: { exception: PolicyException }) {
  const { t } = useTranslation();
  return (
    <Box sx={{ p: 2 }}>
      <SectionBox title={t('Details')}>
        <NameValueTable
          rows={[
            { name: t('Name'), value: exception.jsonData.metadata.name },
            { name: t('Namespace'), value: exception.jsonData.metadata.namespace },
            { name: t('Background'), value: String(exception.background) },
            { name: t('Created'), value: exception.jsonData.metadata.creationTimestamp },
          ]}
        />
      </SectionBox>
      <SectionBox
        title={t('Excepted Policies ({{count}})', { count: exception.exceptions.length })}
      >
        <Table
          columns={[
            { header: t('Policy'), accessorFn: (e: PolicyExceptionEntry) => e.policyName },
            {
              header: t('Rules'),
              accessorFn: (e: PolicyExceptionEntry) => e.ruleNames.join(', '),
              Cell: ({ row }: { row: { original: PolicyExceptionEntry } }) => (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {row.original.ruleNames.map(r => (
                    <Chip key={r} label={r} size="small" variant="outlined" />
                  ))}
                </Box>
              ),
            },
          ]}
          data={exception.exceptions}
          emptyMessage={t('No exceptions defined.')}
        />
      </SectionBox>
      <MatchSection match={exception.spec.match} />
    </Box>
  );
}

export function ExceptionViewer({ name, namespace }: ExceptionViewerProps) {
  const { t } = useTranslation();
  const [exception, error] = PolicyException.useGet(name, namespace);

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">
          {t('Failed to load exception: {{error}}', { error: String(error) })}
        </Typography>
      </Box>
    );
  }

  if (!exception) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <ExceptionContent exception={exception} />;
}
