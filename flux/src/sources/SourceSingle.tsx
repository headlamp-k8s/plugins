import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  ConditionsSection,
  DateLabel,
  DetailsGrid,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import React from 'react';
import { useParams } from 'react-router-dom';
import {
  ForceReconciliationAction,
  ResumeAction,
  SuspendAction,
  SyncAction,
} from '../actions/index';
import Flux404 from '../checkflux';
import Link from '../common/Link';
import RemainingTimeDisplay from '../common/RemainingTimeDisplay';
import { getSourceClassByPluralName } from '../common/Resources';
import StatusLabel from '../common/StatusLabel';

export function FluxSourceDetailView(props: {
  name?: string;
  namespace?: string;
  pluralName?: string;
}) {
  const params = useParams<{
    namespace: string;
    pluralName: string;
    name: string;
  }>();

  const {
    name = params.name,
    namespace = params.namespace,
    pluralName = params.pluralName,
  } = props;

  const { t } = useTranslation();
  const resourceClass = getSourceClassByPluralName(pluralName);

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
          {
            name: t('Status'),
            value: <StatusLabel item={resource} />,
          },
          {
            name: t('Interval'),
            value: resource.jsonData?.spec?.interval,
          },
          {
            name: t('Ref'),
            value: resource.jsonData?.spec?.ref && JSON.stringify(resource.jsonData?.spec?.ref),
          },
          {
            name: t('Timeout'),
            value: resource.jsonData?.spec?.timeout,
          },
          {
            name: t('URL'),
            value: <Link url={resource.jsonData?.spec?.url} />,
            hide: !resource.jsonData?.spec?.url,
          },
          {
            name: t('Chart'),
            hide: !resource.jsonData?.spec?.chart,
            value: resource.jsonData?.spec?.chart,
          },
          {
            name: t('Source Ref'),
            hide: !resource.jsonData?.spec?.sourceRef,
            value:
              resource.jsonData?.spec?.sourceRef &&
              JSON.stringify(resource.jsonData?.spec?.sourceRef),
          },
          {
            name: t('Version'),
            value: resource.jsonData?.spec?.version,
            hide: !resource.jsonData?.spec?.version,
          },
          {
            name: t('Suspend'),
            value: resource.jsonData?.spec?.suspend ? t('True') : t('False'),
          },
        ];

        if (!resource.jsonData?.spec?.suspend && resource.jsonData?.spec?.interval) {
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
            id: 'flux.source-artifact',
            section: resource.jsonData?.status?.artifact && (
              <ArtifactTable artifact={resource.jsonData.status.artifact} />
            ),
          },
          {
            id: 'flux.source-conditions',
            section: <ConditionsSection resource={resource.jsonData} />,
          },
        ];
      }}
    />
  );
}

function ArtifactTable(props: { artifact: any }) {
  const { t } = useTranslation();

  const { artifact } = props;
  if (!artifact) {
    return null;
  }
  return (
    <SectionBox title={t('Artifact')}>
      <NameValueTable
        rows={[
          {
            name: t('Digest'),
            value: artifact.digest,
          },
          {
            name: t('Last Updated Time'),
            value: <DateLabel date={artifact.lastUpdateTime} />,
          },
          {
            name: t('Path'),
            value: artifact.path,
          },
          {
            name: t('Revision'),
            value: artifact.revision,
          },
          {
            name: t('Size'),
            value: artifact.size,
          },
          {
            name: 'URL',
            value: <Link url={artifact.url} wrap />,
          },
        ]}
      />
    </SectionBox>
  );
}
