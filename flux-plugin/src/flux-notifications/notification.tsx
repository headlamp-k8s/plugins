import { useLocation } from 'react-router';
import { apiFactory } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  ConditionsTable,
  DateLabel,
  MainInfoSection,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import React from 'react';
import Event from '@kinvolk/headlamp-plugin/lib/k8s/event';
import { SyncAction, SuspendAction, ResumeAction } from '../actions/index';

const ALERT = 'alerts.notification.toolkit.fluxcd.io';
const PROVIDER = 'providers.notification.toolkit.fluxcd.io';
const RECEIVER = 'receivers.notification.toolkit.fluxcd.io';

export default function Notification() {
  const location = useLocation();
  const segments = location.pathname.split('/');
  // The fourth last segment is the kind
  const namespace = segments[segments.length - 3];
  // The second last segment is the type
  const type = segments[segments.length - 2];
  // The last segment is the name
  const name = segments[segments.length - 1];

  function getType() {
    if (type === 'alerts') {
      return ALERT;
    }
    if (type === 'providers') {
      return PROVIDER;
    }
    return RECEIVER;
  }

  function getKind() {
    if (type === 'alerts') {
      return 'Alert';
    }
    if (type === 'providers') {
      return 'Provider';
    }
    return 'Receiver';
  }

  const CRD = K8s.ResourceClasses.CustomResourceDefinition;
  CRD.apiEndpoint = apiFactory(
    ['apiextensions.k8s.io', 'v1', 'customresourcedefinitions'],
    ['apiextensions.k8s.io', 'v1beta1', 'customresourcedefinitions'],
    ['apiextensions.k8s.io', 'v1beta3', 'customresourcedefinitions']
  );

  const [events, error] = Event?.default.useList({
    namespace: namespace,
    fieldSelector: `involvedObject.name=${name},involvedObject.kind=${getKind()}`,
  });

  const [resource] = CRD.useGet(getType());
  return (
    <>
      {resource && <CustomResourceDetails resource={resource} name={name} namespace={namespace} />}
      <SectionBox title="Events">
        <Table
          data={events}
          columns={[
            {
              header: 'Type',
              accessorFn: item => item.type,
            },
            {
              header: 'Reason',
              accessorFn: item => item.reason,
            },
            {
              header: 'Age',
              accessorFn: item => (
                <DateLabel date={new Date(item.jsonData.lastTimestamp).getTime()} />
              ),
            },
            {
              header: 'From',
              accessorFn: item => item.jsonData.reportingComponent || '-',
            },
            {
              header: 'Message',
              accessorFn: item => item.message,
            },
          ]}
        />
      </SectionBox>
    </>
  );
}

function CustomResourceDetails(props) {
  const { name, namespace, resource } = props;
  const [cr, setCr] = React.useState(null);
  const resourceClass = React.useMemo(() => {
    return resource.makeCRClass();
  }, [resource]);

  resourceClass.useApiGet(setCr, name, namespace);

  function prepareExtraInfo() {
    const extraInfo = [];
    extraInfo.push({ name: 'Suspend', value: cr?.jsonData.spec?.suspend ? 'True' : 'False' });
    return extraInfo;
  }
  return (
    <>
      <MainInfoSection
        resource={cr}
        extraInfo={prepareExtraInfo()}
        actions={[
          <SyncAction resource={cr} />,
          <SuspendAction resource={cr} />,
          <ResumeAction resource={cr} />,
        ]}
      />
      <SectionBox title="Conditions">
        <ConditionsTable resource={cr?.jsonData} />
      </SectionBox>
    </>
  );
}
