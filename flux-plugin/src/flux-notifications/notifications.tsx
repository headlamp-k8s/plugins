import React from 'react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Link, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import CheckIfFluxInstalled from '../checkflux';

export default function Notifications() {
  const [alerts] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
    'alerts.notification.toolkit.fluxcd.io'
  );

  const [providers] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
    'providers.notification.toolkit.fluxcd.io'
  );

  const [receivers] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
    'receivers.notification.toolkit.fluxcd.io'
  );

  const alertsClass = React.useMemo(() => {
    return alerts?.makeCRClass();
  }, [alerts]);

  const providersClass = React.useMemo(() => {
    return providers?.makeCRClass();
  }, [providers]);

  const receiversClass = React.useMemo(() => {
    return receivers?.makeCRClass();
  }, [receivers]);

  return (
    <>
      <CheckIfFluxInstalled />
      {alerts && <Alerts resourceClass={alertsClass} />}
      {providers && <Providers resourceClass={providersClass} />}
      {receivers && <Receivers resourceClass={receiversClass} />}
    </>
  );
}

function Alerts(props) {
  const { resourceClass } = props;
  const [alerts] = resourceClass?.useList();
  return (
    <SectionBox title="Alerts">
      <Table
        data={alerts}
        columns={[
          {
            header: 'Name',
            accessorFn: item => <Link routeName={`/flux/notifications/:namespace/:type/:name`}
              params={{
                name: item.metadata.name,
                namespace: item.metadata.namespace,
                type: 'alerts',
              }}
            >{ item?.jsonData?.metadata.name }</Link>,
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
            header: 'Severity',
            accessorFn: item => item?.jsonData?.spec.eventSeverity,
          },
          {
            header: 'Provider Ref',
            accessorFn: item =>
              item?.jsonData.spec.providerRef && <Link routeName={`/flux/notifications/:namespace/:type/:name`} params={{
                name: item?.jsonData?.spec?.providerRef?.name,
                namespace: item?.metadata.namespace,
                type: 'providers',
              }}>
                {item?.jsonData?.spec?.providerRef?.name}
              </Link>,
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
      />
    </SectionBox>
  );
}

function Providers(props) {
  const { resourceClass } = props;
  const [providers] = resourceClass?.useList();
  return (
    <SectionBox title="Providers">
      <Table
        data={providers}
        columns={[
          {
            header: 'Name',
            accessorFn: item => <Link routeName={`/flux/notifications/:namespace/:type/:name`} params={{
              name: item.metadata.name,
              namespace: item.metadata.namespace,
              type: 'providers',
            }}>{ item.jsonData.metadata.name }</Link>,
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
      />
    </SectionBox>
  );
}

function Receivers(props) {
  const { resourceClass } = props;
  const [receivers] = resourceClass?.useList();

  return (
    <SectionBox title="Receivers">
      <Table
        data={receivers}
        columns={[
          {
            header: 'Name',
            accessorFn: item => <Link routeName={`/flux/notifications/:namespace/:type/:name`} params={{
              name: item.metadata.name,
              namespace: item.metadata.namespace,
              type: 'receivers',
            }}>{ item.jsonData.metadata.name }</Link>,
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
      />
    </SectionBox>
  );
}
