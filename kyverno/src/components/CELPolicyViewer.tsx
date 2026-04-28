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
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Chip, CircularProgress, Typography } from '@mui/material';
import {
  CELGeneration,
  CELMutation,
  DeletingPolicy,
  GeneratingPolicy,
  MutatingPolicy,
  ValidatingPolicy,
} from '../resources/celPolicies';

type CELPolicy = ValidatingPolicy | MutatingPolicy | GeneratingPolicy | DeletingPolicy;

type CELPolicyResourceClass = {
  useGet(name: string): [CELPolicy | null, unknown];
};

export default function CELPolicyViewer({
  name,
  resourceClass,
}: {
  name: string;
  resourceClass: CELPolicyResourceClass;
}) {
  const [policy, error] = resourceClass.useGet(name);

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

  const isValidating = policy instanceof ValidatingPolicy;
  const isMutating = policy instanceof MutatingPolicy;
  const isGenerating = policy instanceof GeneratingPolicy;
  const isDeleting = policy instanceof DeletingPolicy;

  // Cast to specific types after instanceof narrowing for type-safe field access
  const validatingPolicy = isValidating ? (policy as ValidatingPolicy) : null;
  const mutatingPolicy = isMutating ? (policy as MutatingPolicy) : null;
  const generatingPolicy = isGenerating ? (policy as GeneratingPolicy) : null;
  const deletingPolicy = isDeleting ? (policy as DeletingPolicy) : null;

  return (
    <Box sx={{ p: 2 }}>
      <SectionBox title="Details">
        <NameValueTable
          rows={[
            { name: 'Name', value: policy.jsonData?.metadata?.name },
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
            ...(validatingPolicy
              ? [{ name: 'Actions', value: validatingPolicy.validationActions?.join(', ') || '-' }]
              : []),
            ...(deletingPolicy ? [{ name: 'Schedule', value: deletingPolicy.schedule }] : []),
          ]}
        />
      </SectionBox>

      {validatingPolicy && (
        <SectionBox title={`Validations (${validatingPolicy.validationCount || 0})`}>
          <SimpleTable
            columns={[
              { label: 'Expression', getter: (item: any) => item.expression ?? '-' },
              {
                label: 'Message',
                getter: (item: any) => item.message ?? item.messageExpression ?? '-',
              },
              { label: 'Reason', getter: (item: any) => item.reason ?? '-' },
            ]}
            data={validatingPolicy.spec?.validations || []}
          />
        </SectionBox>
      )}

      {mutatingPolicy && (
        <SectionBox title={`Mutations (${mutatingPolicy.mutationCount || 0})`}>
          <SimpleTable
            columns={[
              { label: 'Patch Type', getter: (item: CELMutation) => item.patchType ?? '-' },
              {
                label: 'Apply Configuration',
                getter: (item: CELMutation) => item.applyConfiguration?.expression ?? '-',
              },
              { label: 'RFC6902', getter: (item: CELMutation) => item.rfc6902?.expression ?? '-' },
            ]}
            data={mutatingPolicy.spec?.mutations || []}
          />
        </SectionBox>
      )}

      {generatingPolicy && (
        <SectionBox title={`Generators (${generatingPolicy.generateCount || 0})`}>
          <SimpleTable
            columns={[
              { label: 'Name', getter: (item: CELGeneration) => item.name ?? '-' },
              { label: 'Namespace', getter: (item: CELGeneration) => item.namespace ?? '-' },
              { label: 'Expression', getter: (item: CELGeneration) => item.expression ?? '-' },
            ]}
            data={generatingPolicy.spec?.generate || []}
          />
        </SectionBox>
      )}
    </Box>
  );
}
