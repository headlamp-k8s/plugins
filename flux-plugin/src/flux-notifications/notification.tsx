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
import { ObjectEvents } from '../helpers/index';

const ALERT = 'alerts.notification.toolkit.fluxcd.io';
const PROVIDER = 'providers.notification.toolkit.fluxcd.io';
const RECEIVER = 'receivers.notification.toolkit.fluxcd.io';

export default function Notification() {
  const location = useLocation();
  const segments = location.pathname.split('/');
  const [namespace, type, name] = segments.slice(-3)

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
    namespace,
    fieldSelector: `involvedObject.name=${name},involvedObject.kind=${getKind()}`,
  });

  const [resource] = CRD.useGet(getType());
  return (
    <>
      {resource && <CustomResourceDetails resource={resource} name={name} namespace={namespace} />}
      <SectionBox title="Events">
        <ObjectEvents events={events} />
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
