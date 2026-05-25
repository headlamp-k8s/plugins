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
import { SparkApplicationClass } from '../../resources/sparkApplication';

interface SparkPermissionCheck {
  label: string;
  resource: string;
  verb: string;
}

interface SparkPermissionAccessProps {
  check: SparkPermissionCheck;
  cluster?: string;
  namespace: string;
  serviceAccountUser: string;
}

function formatAccess(allowed: boolean | null, isLoading: boolean, error: string) {
  if (isLoading) {
    return <StatusLabel>Checking</StatusLabel>;
  }

  if (error) {
    return <StatusLabel status="warning">Unknown</StatusLabel>;
  }

  if (allowed === null) {
    return <StatusLabel status="warning">Unknown</StatusLabel>;
  }

  if (allowed) {
    return <StatusLabel status="success">Allowed</StatusLabel>;
  }

  return <StatusLabel status="error">Denied</StatusLabel>;
}

function SparkPermissionAccess({
  check,
  cluster,
  namespace,
  serviceAccountUser,
}: SparkPermissionAccessProps) {
  const resourceAttributes = React.useMemo(
    () => ({
      resource: check.resource,
      verb: check.verb,
      namespace,
    }),
    [check.resource, check.verb, namespace]
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

export function SparkRbacSection({
  sparkApplication,
}: {
  sparkApplication: SparkApplicationClass;
}) {
  const namespace = sparkApplication.metadata.namespace;
  const serviceAccountName = sparkApplication.serviceAccountName;
  const serviceAccountUser = `system:serviceaccount:${namespace}:${serviceAccountName}`;
  const [serviceAccount, serviceAccountError] = K8s.ResourceClasses.ServiceAccount.useGet(
    serviceAccountName,
    namespace,
    { cluster: sparkApplication.cluster }
  );

  const checks = React.useMemo<SparkPermissionCheck[]>(() => {
    const requiredChecks: SparkPermissionCheck[] = [
      { label: 'Create executor pods', resource: 'pods', verb: 'create' },
      { label: 'Get executor pods', resource: 'pods', verb: 'get' },
      { label: 'List executor pods', resource: 'pods', verb: 'list' },
      { label: 'Watch executor pods', resource: 'pods', verb: 'watch' },
      { label: 'Delete executor pods', resource: 'pods', verb: 'delete' },
      { label: 'Create driver service', resource: 'services', verb: 'create' },
    ];

    if (sparkApplication.spec.sparkConfigMap || sparkApplication.spec.hadoopConfigMap) {
      requiredChecks.push({
        label: 'Read config maps',
        resource: 'configmaps',
        verb: 'get',
      });
    }

    return requiredChecks;
  }, [sparkApplication.spec.hadoopConfigMap, sparkApplication.spec.sparkConfigMap]);

  return (
    <SectionBox title="Service Account & RBAC">
      <Box sx={{ display: 'grid', gap: 2 }}>
        <SimpleTable
          data={[
            {
              serviceAccountName,
              subject: serviceAccountUser,
              exists: serviceAccount ? 'Yes' : serviceAccountError ? 'No' : 'Checking...',
            },
          ]}
          columns={[
            {
              label: 'Service Account',
              getter: row => (
                <HeadlampLink
                  routeName="ServiceAccount"
                  params={{ namespace, name: row.serviceAccountName }}
                  activeCluster={sparkApplication.cluster}
                >
                  {row.serviceAccountName}
                </HeadlampLink>
              ),
            },
            { label: 'Subject', getter: row => row.subject },
            { label: 'Exists', getter: row => row.exists },
          ]}
        />

        <Typography variant="subtitle2">
          Driver pods need enough RBAC to create and manage executor pods and create the headless
          driver service used by executors.
        </Typography>

        <SimpleTable
          data={checks}
          columns={[
            { label: 'Permission', getter: check => check.label },
            {
              label: 'Resource',
              getter: check => `${check.verb} ${check.resource}`,
            },
            {
              label: 'Access',
              getter: check => (
                <SparkPermissionAccess
                  check={check}
                  cluster={sparkApplication.cluster}
                  namespace={namespace}
                  serviceAccountUser={serviceAccountUser}
                />
              ),
            },
          ]}
        />
      </Box>
    </SectionBox>
  );
}
