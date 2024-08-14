import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { apiFactory } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  ConditionsTable,
  MainInfoSection,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Event from '@kinvolk/headlamp-plugin/lib/k8s/event';
import React from 'react';
import { useLocation } from 'react-router';
import { ResumeAction,SuspendAction, SyncAction } from '../actions/index';
import { ObjectEvents, prepareTimePassedString } from '../helpers/index';

const ALERT = 'alerts.notification.toolkit.fluxcd.io';
const PROVIDER = 'providers.notification.toolkit.fluxcd.io';
const RECEIVER = 'receivers.notification.toolkit.fluxcd.io';

const NOTIFICATION_BETA_VERSION = 'v1beta3';

export default function Notification() {
  const location = useLocation();
  const segments = location.pathname.split('/');
  const [namespace, type, name] = segments.slice(-3);

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
  const isVersionAvailable = CRD.apiEndpoint.apiInfo.find(
    apiInfo => apiInfo.version === NOTIFICATION_BETA_VERSION
  );
  if (!isVersionAvailable) {
    CRD.apiEndpoint = apiFactory(
      ...CRD.apiEndpoint.apiInfo.map((apiInfo) => {
        const params = [];
        params.push(apiInfo.group);
        params.push(apiInfo.version);
        params.push(apiInfo.resource);
        return params;
      }),
      ['apiextensions.k8s.io', NOTIFICATION_BETA_VERSION, 'customresourcedefinitions']
    );
  }

  const [events] = Event?.default.useList({
    namespace,
    fieldSelector: `involvedObject.name=${name},involvedObject.kind=${getKind()}`,
  });

  const [resource] = CRD.useGet(getType());
  return (
    <>
      {resource && <CustomResourceDetails resource={resource} name={name} namespace={namespace} />}
      <ObjectEvents events={events} />
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
    const interval = cr?.jsonData.spec?.interval;
    extraInfo.push({ name: 'Interval', value: interval });
    const lastHandledReconcileAt = cr?.jsonData?.status?.lastHandledReconcileAt;
    const timeStampStr = prepareTimePassedString(lastHandledReconcileAt, interval);
    if (lastHandledReconcileAt) {
      extraInfo.push({
        name: 'ExpectedNextReconciliation',
        value: timeStampStr,
      });
    }
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
