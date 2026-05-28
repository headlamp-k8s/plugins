import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
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

function formatAccess(allowed: boolean | null, isLoading: boolean, error: string, t: any) {
  if (isLoading) {
    return <StatusLabel>{t('Checking')}</StatusLabel>;
  }

  if (error) {
    return <StatusLabel status="warning">{t('Unknown')}</StatusLabel>;
  }

  if (allowed === null) {
    return <StatusLabel status="warning">{t('Unknown')}</StatusLabel>;
  }

  if (allowed) {
    return <StatusLabel status="success">{t('Allowed')}</StatusLabel>;
  }

  return <StatusLabel status="error">{t('Denied')}</StatusLabel>;
}

function SparkPermissionAccess({
  check,
  cluster,
  namespace,
  serviceAccountUser,
}: SparkPermissionAccessProps) {
  const { t } = useTranslation();
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
      {formatAccess(access.allowed, access.isLoading, access.error, t)}
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
  const { t } = useTranslation();
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
      { label: t('Create executor pods'), resource: 'pods', verb: 'create' },
      { label: t('Get executor pods'), resource: 'pods', verb: 'get' },
      { label: t('List executor pods'), resource: 'pods', verb: 'list' },
      { label: t('Watch executor pods'), resource: 'pods', verb: 'watch' },
      { label: t('Delete executor pods'), resource: 'pods', verb: 'delete' },
      { label: t('Create driver service'), resource: 'services', verb: 'create' },
    ];

    if (sparkApplication.spec.sparkConfigMap || sparkApplication.spec.hadoopConfigMap) {
      requiredChecks.push({
        label: t('Read config maps'),
        resource: 'configmaps',
        verb: 'get',
      });
    }

    return requiredChecks;
  }, [sparkApplication.spec.hadoopConfigMap, sparkApplication.spec.sparkConfigMap, t]);

  return (
    <SectionBox title={t('Service Account & RBAC')}>
      <Box sx={{ display: 'grid', gap: 2 }}>
        <SimpleTable
          data={[
            {
              serviceAccountName,
              subject: serviceAccountUser,
              exists: serviceAccount ? t('Yes') : serviceAccountError ? t('No') : t('Checking...'),
            },
          ]}
          columns={[
            {
              label: t('Service Account'),
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
            { label: t('Subject'), getter: row => row.subject },
            { label: t('Exists'), getter: row => row.exists },
          ]}
        />

        <Typography variant="subtitle2">
          {t(
            'Driver pods need enough RBAC to create and manage executor pods and create the headless driver service used by executors.'
          )}
        </Typography>

        <SimpleTable
          data={checks}
          columns={[
            { label: t('Permission'), getter: check => check.label },
            {
              label: t('Resource'),
              getter: check => `${check.verb} ${check.resource}`,
            },
            {
              label: t('Access'),
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
