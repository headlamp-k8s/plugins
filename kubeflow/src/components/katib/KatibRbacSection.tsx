import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  Link as HeadlampLink,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useSubjectAccessReview } from '../../hooks/useSubjectAccessReview';
import { KatibExperimentClass } from '../../resources/katibExperiment';

interface KatibRbacSectionProps {
  experiment: KatibExperimentClass;
  title?: string;
}

interface PermissionCheck {
  label: string;
  verb: string;
  resource: string;
  subresource?: string;
}

function formatAccess(allowed: boolean | null, isLoading: boolean, error: string): React.ReactNode {
  if (isLoading) {
    return <StatusLabel>Checking</StatusLabel>;
  }
  if (error) {
    return <StatusLabel status="warning">Unknown</StatusLabel>;
  }
  if (allowed === null) {
    return <StatusLabel>Unknown</StatusLabel>;
  }
  return allowed ? (
    <StatusLabel status="success">Allowed</StatusLabel>
  ) : (
    <StatusLabel status="error">Denied</StatusLabel>
  );
}

function KatibPermissionAccess({
  serviceAccountUser,
  namespace,
  cluster,
  check,
}: {
  serviceAccountUser: string;
  namespace: string;
  cluster?: string;
  check: PermissionCheck;
}) {
  const resourceAttributes = React.useMemo(
    () => ({
      group: 'kubeflow.org',
      version: 'v1beta1',
      resource: check.resource,
      subresource: check.subresource,
      verb: check.verb,
      namespace,
    }),
    [check.resource, check.subresource, check.verb, namespace]
  );

  const access = useSubjectAccessReview({
    user: serviceAccountUser,
    resourceAttributes,
    cluster,
  });

  return (
    <Box sx={{ display: 'grid', gap: 0.5 }}>
      {formatAccess(access.allowed, access.isLoading, access.error)}
      {(access.error || access.reason) && (
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {access.error || access.reason}
        </Typography>
      )}
    </Box>
  );
}

export function KatibRbacSection({
  experiment,
  title = 'RBAC & Service Accounts',
}: KatibRbacSectionProps) {
  const namespace = experiment.metadata.namespace;
  const workerServiceAccount = experiment.trialServiceAccountName || 'default';
  const suggestionServiceAccount = experiment.suggestionServiceAccountName || 'default';
  const workerServiceAccountUser = `system:serviceaccount:${namespace}:${workerServiceAccount}`;
  const suggestionServiceAccountUser = `system:serviceaccount:${namespace}:${suggestionServiceAccount}`;
  const [workerSa, workerSaError] = K8s.ResourceClasses.ServiceAccount.useGet(
    workerServiceAccount,
    namespace,
    { cluster: experiment.cluster }
  );
  const [suggestionSa, suggestionSaError] = K8s.ResourceClasses.ServiceAccount.useGet(
    suggestionServiceAccount,
    namespace,
    { cluster: experiment.cluster }
  );

  const checks: PermissionCheck[] = React.useMemo(
    () => [
      {
        label: 'Read Trials',
        verb: 'list',
        resource: 'trials',
      },
      {
        label: 'Update Trial status',
        verb: 'update',
        resource: 'trials',
        subresource: 'status',
      },
      {
        label: 'Patch Trial status',
        verb: 'patch',
        resource: 'trials',
        subresource: 'status',
      },
    ],
    []
  );

  return (
    <SectionBox title={title}>
      <Box sx={{ display: 'grid', gap: 2 }}>
        <SimpleTable
          data={[
            {
              role: 'Trial Worker',
              serviceAccount: workerServiceAccount,
              subject: workerServiceAccountUser,
              exists: workerSa ? 'Yes' : workerSaError ? 'No' : 'Checking...',
            },
            {
              role: 'Suggestion / Early Stopping',
              serviceAccount: suggestionServiceAccount,
              subject: suggestionServiceAccountUser,
              exists: suggestionSa ? 'Yes' : suggestionSaError ? 'No' : 'Checking...',
            },
          ]}
          columns={[
            { label: 'Role', getter: row => row.role },
            {
              label: 'Service Account',
              getter: row => (
                <HeadlampLink
                  routeName="ServiceAccount"
                  params={{ namespace, name: row.serviceAccount }}
                  activeCluster={experiment.cluster}
                >
                  {row.serviceAccount}
                </HeadlampLink>
              ),
            },
            { label: 'Subject', getter: row => row.subject },
            { label: 'Exists', getter: row => row.exists },
          ]}
        />

        <Typography variant="subtitle2">Trial Worker Permissions</Typography>
        <SimpleTable
          data={checks}
          columns={[
            { label: 'Permission', getter: check => check.label },
            {
              label: 'Resource',
              getter: check =>
                check.subresource
                  ? `${check.verb} ${check.resource}/${check.subresource}`
                  : `${check.verb} ${check.resource}`,
            },
            {
              label: 'Access',
              getter: check => (
                <KatibPermissionAccess
                  serviceAccountUser={workerServiceAccountUser}
                  namespace={namespace}
                  cluster={experiment.cluster}
                  check={check}
                />
              ),
            },
          ]}
        />

        <Typography variant="subtitle2">Suggestion / Early Stopping Permissions</Typography>
        <SimpleTable
          data={checks}
          columns={[
            { label: 'Permission', getter: check => check.label },
            {
              label: 'Resource',
              getter: check =>
                check.subresource
                  ? `${check.verb} ${check.resource}/${check.subresource}`
                  : `${check.verb} ${check.resource}`,
            },
            {
              label: 'Access',
              getter: check => (
                <KatibPermissionAccess
                  serviceAccountUser={suggestionServiceAccountUser}
                  namespace={namespace}
                  cluster={experiment.cluster}
                  check={check}
                />
              ),
            },
          ]}
        />
      </Box>
    </SectionBox>
  );
}
