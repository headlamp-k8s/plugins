import {
  ConditionsTable,
  MainInfoSection,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Event from '@kinvolk/headlamp-plugin/lib/k8s/event';
import React from 'react';
import { useParams } from 'react-router-dom';
import {
  ForceReconciliationAction,
  ResumeAction,
  SuspendAction,
  SyncAction,
} from '../actions/index';
import Flux404 from '../checkflux';
import RemainingTimeDisplay from '../common/RemainingTimeDisplay';
import { ObjectEvents } from '../helpers/index';
import {
  alertNotificationClass,
  providerNotificationClass,
  receiverNotificationClass,
} from './NotificationList';

export function Notification() {
  const { namespace, pluralName, name } = useParams<{
    namespace: string;
    pluralName: string;
    name: string;
  }>();
  const resourceClass = (() => {
    switch (pluralName) {
      case 'alerts':
        return alertNotificationClass();
      case 'providers':
        return providerNotificationClass();
      case 'receivers':
        return receiverNotificationClass();
      default:
        return null;
    }
  })();

  if (!resourceClass) {
    return <Flux404 message={`Unknown type ${pluralName}`} />;
  }

  const [events] = Event.useList({
    namespace,
    fieldSelector: `involvedObject.name=${name},involvedObject.kind=${resourceClass.kind}`,
  });

  return (
    <>
      <NotificationDetails name={name} namespace={namespace} resourceClass={resourceClass} />
      <ObjectEvents events={events} />
    </>
  );
}

function NotificationDetails(props) {
  const { name, namespace, resourceClass } = props;
  const [resource, setResource] = React.useState(null);

  resourceClass.useApiGet(setResource, name, namespace);

  function prepareExtraInfo() {
    const extraInfo = [];
    extraInfo.push({ name: 'Suspend', value: resource?.jsonData.spec?.suspend ? 'True' : 'False' });
    const interval = resource?.jsonData.spec?.interval;
    extraInfo.push({ name: 'Interval', value: interval });
    if (!resource?.jsonData.spec?.suspend) {
      extraInfo.push({
        name: 'Next Reconciliation',
        value: <RemainingTimeDisplay item={resource} />,
      });
    }
    return extraInfo;
  }
  return (
    <>
      <MainInfoSection
        resource={resource}
        extraInfo={prepareExtraInfo()}
        actions={[
          <SyncAction resource={resource} />,
          <SuspendAction resource={resource} />,
          <ResumeAction resource={resource} />,
          <ForceReconciliationAction resource={resource} />,
        ]}
      />
      <SectionBox title="Conditions">
        <ConditionsTable resource={resource?.jsonData} />
      </SectionBox>
    </>
  );
}
