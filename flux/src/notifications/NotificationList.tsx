import {
  Link,
  SectionBox,
  SectionFilterHeader,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Box } from '@mui/material';
import { NotSupported } from '../checkflux';
import Table from '../common/Table';
import { NameLink } from '../helpers';
import React from 'react';

const notificationGroup = 'notification.toolkit.fluxcd.io';
const notificationVersion = 'v1beta3';

export function alertNotificationClass() {
  return makeCustomResourceClass({
    apiInfo: [{ group: notificationGroup, version: notificationVersion }],
    isNamespaced: true,
    singularName: 'alert',
    pluralName: 'alerts',
  });
}

export function providerNotificationClass() {
  return makeCustomResourceClass({
    apiInfo: [{ group: notificationGroup, version: notificationVersion }],
    isNamespaced: true,
    singularName: 'provider',
    pluralName: 'providers',
  });
}

export function receiverNotificationClass() {
  return makeCustomResourceClass({
    apiInfo: [{ group: notificationGroup, version: notificationVersion }],
    isNamespaced: true,
    singularName: 'receiver',
    pluralName: 'receivers',
  });
}

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
  const filterFunction = useFilterFunc();
  const [resources, setResources] = React.useState(null);
  const [error, setError] = React.useState(null);

  alertNotificationClass().useApiList(setResources, setError);

  if (error?.status === 404) {
    return <NotSupported typeName="Alerts" />
  }

  return (
    <SectionBox title={<SectionFilterHeader title="Alerts" />}>
      <Table
        data={resources}
        columns={[
          NameLink(alertNotificationClass()),
          'namespace',
          {
            header: 'Severity',
            accessorFn: item => item?.jsonData?.spec.eventSeverity,
          },
          {
            header: 'Provider Ref',
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
            header: 'Event Sources',
            accessorFn: item =>
              item?.jsonData.spec?.eventSources
                .map(source => `${source.kind}/${source.name}`)
                .join(', '),
          },
          {
            header: 'Summary',
            accessorFn: item => item?.jsonData?.spec.summary,
          },
        ]}
        filterFunction={filterFunction}
      />
    </SectionBox>
  );
}

function Providers() {
  const filterFunction = useFilterFunc();
  const [resources, setResources] = React.useState(null);
  const [error, setError] = React.useState(null);

  providerNotificationClass().useApiList(setResources, setError);

  if (error?.status === 404) {
    return <NotSupported typeName="Providers" />
  }

  return (
    <SectionBox title="Providers">
      <Table
        data={resources}
        columns={[
          {
            header: 'Name',
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
            header: 'Namespace',
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
            header: 'certSecretRef',
            accessorFn: item =>
              (item.jsonData.spec.certSecretRef &&
                JSON.stringify(item.jsonData.spec.certSecretRef)) ||
              '-',
          },
          {
            header: 'Interval',
            accessorFn: item => item.jsonData.spec.interval || '-',
          },
          {
            header: 'Timeout',
            accessorFn: item => item.jsonData.spec.timeout || '-',
          },
          {
            header: 'Address',
            accessorFn: item => item.jsonData.spec.address || '-',
          },
          {
            header: 'channel',
            accessorFn: item => item.jsonData.spec.channel,
          },
          {
            header: 'Type',
            accessorFn: item => item.jsonData.spec.type,
          },
          {
            header: 'Username',
            accessorFn: item => item.jsonData.spec.username || '-',
          },
          {
            header: 'Proxy',
            accessorFn: item => item.jsonData.spec.proxy || '-',
          },
        ]}
        filterFunction={filterFunction}
      />
    </SectionBox>
  );
}

function Receivers() {
  const filterFunction = useFilterFunc();
  const [resources, setResources] = React.useState(null);
  const [error, setError] = React.useState(null);

  receiverNotificationClass().useApiList(setResources, setError);

  if (error?.status === 404) {
    return <NotSupported typeName="Receivers" />
  }

  return (
    <SectionBox title="Receivers">
      <Table
        data={resources}
        columns={[
          {
            header: 'Name',
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
            header: 'Namespace',
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
            header: 'Type',
            accessorFn: item => item.jsonData.spec.type,
          },
          { header: 'Events', accessorFn: item => item.jsonData.spec.events },
          {
            header: 'Interval',
            accessorFn: item => item.jsonData.spec.interval,
          },
          {
            header: 'Resources',
            accessorFn: item =>
              item.jsonData.spec?.resources &&
              item.jsonData.spec.resources.map(obj => (
                <Box>{JSON.stringify(obj).replace(/"/g, '')}</Box>
              )),
          },
          {
            header: 'Secret Ref',
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
