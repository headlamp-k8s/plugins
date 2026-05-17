import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  ConditionsTable,
  DateLabel,
  MainInfoSection,
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
import { ObjectEvents } from '../helpers/index';

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

  const resourceClass = getSourceClassByPluralName(pluralName);

  if (!resourceClass) {
    return <Flux404 message={`Unknown type ${pluralName}`} />;
  }

  return <SourceDetailView name={name} namespace={namespace} resourceClass={resourceClass} />;
}

function SourceDetailView(props) {
  const { name, namespace, resourceClass } = props;
  const [resource, setResource] = React.useState(null);
  const { t } = useTranslation();

  resourceClass.useApiGet(setResource, name, namespace);

  function prepareExtraInfo() {
    const interval = resource?.jsonData.spec?.interval;
    const extraInfo = [
      {
        name: t('Status'),
        value: <StatusLabel item={resource} />,
      },
      {
        name: t('Interval'),
        value: interval,
      },
      {
        name: t('Ref'),
        value: resource?.jsonData.spec?.ref && JSON.stringify(resource?.jsonData.spec?.ref),
      },
      {
        name: t('Timeout'),
        value: resource?.jsonData.spec?.timeout,
      },
      {
        name: t('URL'),
        value: <Link url={resource?.jsonData.spec?.url} />,
        hide: !resource?.jsonData.spec?.url,
      },
      {
        name: t('Chart'),
        hide: !resource?.jsonData.spec?.chart,
        value: resource?.jsonData.spec?.chart,
      },
      {
        name: t('Source Ref'),
        hide: !resource?.jsonData.spec?.sourceRef,
        value:
          resource?.jsonData.spec?.sourceRef && JSON.stringify(resource?.jsonData.spec?.sourceRef),
      },
      {
        name: t('Version'),
        value: resource?.jsonData.spec?.version,
        hide: !resource?.jsonData.spec?.version,
      },
      {
        name: t('Suspend'),
        value: resource?.jsonData.spec?.suspend ? t('True') : t('False'),
      },
    ];

    if (!resource?.jsonData.spec?.suspend && resource?.jsonData.spec?.interval) {
      extraInfo.push({
        name: t('Next Reconciliation'),
        value: <RemainingTimeDisplay item={resource} />,
      });
    }

    return extraInfo;
  }

  return (
    <>
      <MainInfoSection
        resource={resource}
        actions={[
          <SyncAction resource={resource} />,
          <SuspendAction resource={resource} />,
          <ResumeAction resource={resource} />,
          <ForceReconciliationAction resource={resource} />,
        ]}
        extraInfo={prepareExtraInfo()}
      />
      {resource && <ObjectEvents namespace={namespace} name={name} resourceClass={resourceClass} />}
      {resource && (
        <SectionBox title={t('Conditions')}>
          <ConditionsTable resource={resource?.jsonData} showLastUpdate={false} />
        </SectionBox>
      )}

      {resource && <ArtifactTable artifact={resource?.jsonData?.status?.artifact} />}
    </>
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
