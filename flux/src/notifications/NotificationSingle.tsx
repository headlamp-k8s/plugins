import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { apiFactory } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  ConditionsTable,
  MainInfoSection,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Event from '@kinvolk/headlamp-plugin/lib/k8s/event';
import React from 'react';
import { useParams } from 'react-router-dom';
import { ForceReconciliationAction, ResumeAction, SuspendAction, SyncAction } from '../actions/index';
import RemainingTimeDisplay from '../common/RemainingTimeDisplay';
import { ObjectEvents } from '../helpers/index';

const ALERT = 'alerts.notification.toolkit.fluxcd.io';
const PROVIDER = 'providers.notification.toolkit.fluxcd.io';
const RECEIVER = 'receivers.notification.toolkit.fluxcd.io';

const NOTIFICATION_BETA_VERSION = 'v1beta3';

export default function Notification() {
  const { namespace, type, name } = useParams<{ namespace: string; type: string; name: string }>();

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
      ...CRD.apiEndpoint.apiInfo.map(apiInfo => {
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
    if (!cr?.jsonData.spec?.suspend) {
      extraInfo.push({
        name: 'Next Reconciliation',
        value: <RemainingTimeDisplay item={cr} />,
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
          <ForceReconciliationAction resource={cr} />,
        ]}
      />
      <SectionBox title="Conditions">
        <ConditionsTable resource={cr?.jsonData} />
      </SectionBox>
    </>
  );
}
