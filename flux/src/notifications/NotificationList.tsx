import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  Link,
  SectionBox,
  SectionFilterHeader,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Box } from '@mui/material';
import React from 'react';
import { NotSupported } from '../checkflux';
import { AlertNotification, ProviderNotification, ReceiverNotification } from '../common/Resources';
import Table from '../common/Table';
import { useNamespaces } from '../helpers';

export function Notifications() {
  return (
    <>
      <Alerts />
      <Providers />
      <Receivers />
    </>
  );
}

function Alerts() {
  const { t } = useTranslation();
  const filterFunction = useFilterFunc();
  const [resources, error] = AlertNotification.useList({ namespace: useNamespaces() });

  if (error?.status === 404) {
    return <NotSupported typeName="Alerts" />;
  }

  return (
    <SectionBox title={<SectionFilterHeader title={t('Alerts')} />}>
      <Table
        data={resources}
        columns={[
          {
            header: t('Name'),
            accessorKey: 'metadata.name',
            Cell: ({ row: { original: item } }) => (
              <Link
                routeName="notification"
                params={{
                  name: item.metadata.name,
                  namespace: item.metadata.namespace,
                  pluralName: 'alerts',
                }}
              >
                {item?.jsonData?.metadata.name}
              </Link>
            ),
          },
          'namespace',
          {
            header: t('Severity'),
            accessorFn: item => item?.jsonData?.spec.eventSeverity,
          },
          {
            header: t('Provider Ref'),
            accessorFn: item =>
              item?.jsonData.spec.providerRef && (
                <Link
                  routeName="notification"
                  params={{
                    name: item?.jsonData?.spec?.providerRef?.name,
                    namespace: item?.metadata.namespace,
                    pluralName: 'providers',
                  }}
                >
                  {item?.jsonData?.spec?.providerRef?.name}
                </Link>
              ),
          },
          {
            header: t('Event Sources'),
            accessorFn: item =>
              item?.jsonData.spec?.eventSources
                .map(source => `${source.kind}/${source.name}`)
                .join(', '),
          },
          {
            header: t('Summary'),
            accessorFn: item => item?.jsonData?.spec.summary,
          },
        ]}
        filterFunction={filterFunction}
      />
    </SectionBox>
  );
}

function Providers() {
  const { t } = useTranslation();
  const filterFunction = useFilterFunc();
  const [resources, error] = ProviderNotification.useList({ namespace: useNamespaces() });

  if (error?.status === 404) {
    return <NotSupported typeName="Providers" />;
  }

  return (
    <SectionBox title={t('Providers')}>
      <Table
        data={resources}
        columns={[
          {
            header: t('Name'),
            accessorKey: 'metadata.name',
            Cell: ({ row: { original: item } }) => (
              <Link
                routeName="notification"
                params={{
                  name: item.metadata.name,
                  namespace: item.metadata.namespace,
                  pluralName: 'providers',
                }}
              >
                {item?.jsonData?.metadata.name}
              </Link>
            ),
          },
          {
            header: t('Namespace'),
            accessorFn: item => (
              <Link
                routeName="namespace"
                params={{
                  name: item.metadata.namespace,
                }}
              >
                {item.metadata.namespace}
              </Link>
            ),
          },
          {
            header: t('certSecretRef'),
            accessorFn: item =>
              (item.jsonData.spec.certSecretRef &&
                JSON.stringify(item.jsonData.spec.certSecretRef)) ||
              '-',
          },
          {
            header: t('Interval'),
            accessorFn: item => item.jsonData.spec.interval || '-',
          },
          {
            header: t('Timeout'),
            accessorFn: item => item.jsonData.spec.timeout || '-',
          },
          {
            header: t('Address'),
            accessorFn: item => item.jsonData.spec.address || '-',
          },
          {
            header: t('channel'),
            accessorFn: item => item.jsonData.spec.channel,
          },
          {
            header: t('Type'),
            accessorFn: item => item.jsonData.spec.type,
          },
          {
            header: t('Username'),
            accessorFn: item => item.jsonData.spec.username || '-',
          },
          {
            header: t('Proxy'),
            accessorFn: item => item.jsonData.spec.proxy || '-',
          },
        ]}
        filterFunction={filterFunction}
      />
    </SectionBox>
  );
}

function Receivers() {
  const { t } = useTranslation();
  const filterFunction = useFilterFunc();
  const [resources, error] = ReceiverNotification.useList({ namespace: useNamespaces() });

  if (error?.status === 404) {
    return <NotSupported typeName="Receivers" />;
  }

  return (
    <SectionBox title={t('Receivers')}>
      <Table
        data={resources}
        columns={[
          {
            header: t('Name'),
            accessorKey: 'metadata.name',
            Cell: ({ row: { original: item } }) => (
              <Link
                routeName="notification"
                params={{
                  name: item.metadata.name,
                  namespace: item.metadata.namespace,
                  pluralName: 'receivers',
                }}
              >
                {item.jsonData.metadata.name}
              </Link>
            ),
          },
          {
            header: t('Namespace'),
            accessorKey: 'metadata.namespace',
            Cell: ({ row: { original: item } }) => (
              <Link
                routeName="namespace"
                params={{
                  name: item.metadata.namespace,
                }}
              >
                {item.metadata.namespace}
              </Link>
            ),
          },
          {
            header: t('Type'),
            accessorFn: item => item.jsonData.spec.type,
          },
          { header: t('Events'), accessorFn: item => item.jsonData.spec.events },
          {
            header: t('Interval'),
            accessorFn: item => item.jsonData.spec.interval,
          },
          {
            header: t('Resources'),
            accessorFn: item =>
              item.jsonData.spec?.resources &&
              item.jsonData.spec.resources.map(obj => (
                <Box>{JSON.stringify(obj).replace(/"/g, '')}</Box>
              )),
          },
          {
            header: t('Secret Ref'),
            accessorFn: item =>
              item.jsonData.spec.secretRef && (
                <Link
                  routeName="secret"
                  params={{
                    name: item.jsonData.spec.secretRef.name,
                    namespace: item.metadata.namespace,
                  }}
                >
                  {item.jsonData.spec.secretRef.name}
                </Link>
              ),
          },
        ]}
        filterFunction={filterFunction}
      />
    </SectionBox>
  );
}
