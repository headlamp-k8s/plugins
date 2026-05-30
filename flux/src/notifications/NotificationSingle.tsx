import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ConditionsSection, DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
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
import { AlertNotification, ProviderNotification, ReceiverNotification } from '../common/Resources';

export function Notification() {
  const { namespace, pluralName, name } = useParams<{
    namespace: string;
    pluralName: string;
    name: string;
  }>();
  const { t } = useTranslation();

  const resourceClass = (() => {
    switch (pluralName) {
      case 'alerts':
        return AlertNotification;
      case 'providers':
        return ProviderNotification;
      case 'receivers':
        return ReceiverNotification;
      default:
        return null;
    }
  })();

  if (!resourceClass) {
    return <Flux404 message={t('Unknown type {{pluralName}}', { pluralName })} />;
  }

  return (
    <DetailsGrid
      resourceType={resourceClass}
      name={name}
      namespace={namespace}
      withEvents
      actions={resource => {
        if (!resource) return [];
        return [
          <SyncAction resource={resource} />,
          <SuspendAction resource={resource} />,
          <ResumeAction resource={resource} />,
          <ForceReconciliationAction resource={resource} />,
        ];
      }}
      extraInfo={resource => {
        if (!resource) return [];
        const info: any[] = [
          { name: t('Suspend'), value: resource.jsonData?.spec?.suspend ? t('True') : t('False') },
        ];
        const interval = resource.jsonData?.spec?.interval;
        info.push({ name: t('Interval'), value: interval });
        if (!resource.jsonData?.spec?.suspend) {
          info.push({
            name: t('Next Reconciliation'),
            value: <RemainingTimeDisplay item={resource} />,
          });
        }
        return info;
      }}
      extraSections={resource => {
        if (!resource) return [];
        return [
          {
            id: 'flux.notification-conditions',
            section: <ConditionsSection resource={resource.jsonData} />,
          },
        ];
      }}
    />
  );
}
