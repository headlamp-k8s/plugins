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

import {
  AuthVisible,
  DeleteButton,
  EditButton,
  NameValueTable,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Chip, CircularProgress, Typography } from '@mui/material';
import {
  Attestor,
  CELValidation,
  ImageAttestation,
  ImageMatchReference,
  ImageValidatingPolicy,
} from '../resources/celPolicies';

interface ImageValidatingPolicyViewerProps {
  name: string;
}

function attestorType(attestor: Attestor): string {
  if (attestor.cosign?.key) return 'Cosign Key';
  if (attestor.cosign?.keyless) return 'Cosign Keyless';
  if (attestor.cosign?.certificate) return 'Cosign Certificate';
  if (attestor.cosign) return 'Cosign';
  if (attestor.notary) return 'Notary';
  return 'Unknown';
}

function PolicyContent({ policy }: { policy: ImageValidatingPolicy }) {
  const annotations = policy.jsonData.metadata.annotations || {};

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', gap: 1, mb: 2, justifyContent: 'flex-end' }}>
        <AuthVisible item={policy} authVerb="update">
          <EditButton item={policy} />
        </AuthVisible>
        <AuthVisible item={policy} authVerb="delete">
          <DeleteButton item={policy} />
        </AuthVisible>
      </Box>

      <SectionBox title="Details">
        <NameValueTable
          rows={[
            { name: 'Name', value: policy.jsonData.metadata.name },
            {
              name: 'Ready',
              value: (
                <Chip
                  label={policy.ready ? 'True' : 'False'}
                  color={policy.ready ? 'success' : 'error'}
                  size="small"
                />
              ),
            },
            {
              name: 'Admission',
              value: policy.spec.evaluation?.admission?.enabled !== false ? 'Enabled' : 'Disabled',
            },
            {
              name: 'Background',
              value: policy.spec.evaluation?.background?.enabled !== false ? 'Enabled' : 'Disabled',
            },
            { name: 'Created', value: policy.jsonData.metadata.creationTimestamp },
            ...(annotations['policies.kyverno.io/title']
              ? [{ name: 'Title', value: annotations['policies.kyverno.io/title'] }]
              : []),
            ...(annotations['policies.kyverno.io/description']
              ? [{ name: 'Description', value: annotations['policies.kyverno.io/description'] }]
              : []),
            ...(annotations['policies.kyverno.io/category']
              ? [{ name: 'Category', value: annotations['policies.kyverno.io/category'] }]
              : []),
            ...(annotations['policies.kyverno.io/severity']
              ? [{ name: 'Severity', value: annotations['policies.kyverno.io/severity'] }]
              : []),
          ]}
        />
      </SectionBox>

      <SectionBox title={`Image References (${policy.spec.matchImageReferences?.length || 0})`}>
        <Table
          columns={[
            {
              header: 'Pattern',
              accessorFn: (r: ImageMatchReference) => r.glob || r.expression || '-',
            },
            {
              header: 'Type',
              accessorFn: (r: ImageMatchReference) => (r.glob ? 'Glob' : 'CEL Expression'),
              Cell: ({ row }: { row: { original: ImageMatchReference } }) => (
                <Chip
                  label={row.original.glob ? 'Glob' : 'CEL'}
                  size="small"
                  variant="outlined"
                />
              ),
            },
          ]}
          data={policy.spec.matchImageReferences || []}
          emptyMessage="No image references defined."
        />
      </SectionBox>

      <SectionBox title={`Attestors (${policy.spec.attestors?.length || 0})`}>
        <Table
          columns={[
            { header: 'Name', accessorFn: (a: Attestor) => a.name || '-' },
            {
              header: 'Type',
              accessorFn: (a: Attestor) => attestorType(a),
              Cell: ({ row }: { row: { original: Attestor } }) => (
                <Chip label={attestorType(row.original)} size="small" variant="outlined" />
              ),
            },
          ]}
          data={policy.spec.attestors || []}
          emptyMessage="No attestors defined."
        />
      </SectionBox>

      {policy.spec.attestations && policy.spec.attestations.length > 0 && (
        <SectionBox title={`Attestations (${policy.spec.attestations.length})`}>
          <Table
            columns={[
              { header: 'Name', accessorFn: (a: ImageAttestation) => a.name },
              {
                header: 'Type',
                accessorFn: (a: ImageAttestation) =>
                  a.intoto?.type || a.referrer?.type || '-',
              },
              {
                header: 'Format',
                accessorFn: (a: ImageAttestation) => (a.intoto ? 'In-Toto' : a.referrer ? 'Referrer' : '-'),
                Cell: ({ row }: { row: { original: ImageAttestation } }) => (
                  <Chip
                    label={row.original.intoto ? 'In-Toto' : row.original.referrer ? 'Referrer' : '-'}
                    size="small"
                    variant="outlined"
                  />
                ),
              },
            ]}
            data={policy.spec.attestations}
          />
        </SectionBox>
      )}

      {policy.spec.validations && policy.spec.validations.length > 0 && (
        <SectionBox title={`Validations (${policy.spec.validations.length})`}>
          <Table
            columns={[
              { header: 'Expression', accessorFn: (v: CELValidation) => v.expression },
              { header: 'Message', accessorFn: (v: CELValidation) => v.message || '-' },
            ]}
            data={policy.spec.validations}
          />
        </SectionBox>
      )}
    </Box>
  );
}

export function ImageValidatingPolicyViewer({ name }: ImageValidatingPolicyViewerProps) {
  const [policy, error] = ImageValidatingPolicy.useGet(name);

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Failed to load policy: {String(error)}</Typography>
      </Box>
    );
  }

  if (!policy) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return <PolicyContent policy={policy} />;
}
