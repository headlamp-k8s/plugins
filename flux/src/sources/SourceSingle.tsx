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

  const resourceClass = getSourceClassByPluralName(pluralName);

  if (!resourceClass) {
    return <Flux404 message={`Unknown type ${pluralName}`} />;
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
            name: 'Status',
            value: <StatusLabel item={resource} />,
          },
          {
            name: 'Interval',
            value: resource.jsonData.spec?.interval,
          },
          {
            name: 'Ref',
            value: resource.jsonData.spec?.ref && JSON.stringify(resource.jsonData.spec?.ref),
          },
          {
            name: 'Timeout',
            value: resource.jsonData.spec?.timeout,
          },
          {
            name: 'URL',
            value: <Link url={resource.jsonData.spec?.url} />,
            hide: !resource.jsonData.spec?.url,
          },
          {
            name: 'Chart',
            hide: !resource.jsonData.spec?.chart,
            value: resource.jsonData.spec?.chart,
          },
          {
            name: 'Source Ref',
            hide: !resource.jsonData.spec?.sourceRef,
            value:
              resource.jsonData.spec?.sourceRef &&
              JSON.stringify(resource.jsonData.spec?.sourceRef),
          },
          {
            name: 'Version',
            value: resource.jsonData.spec?.version,
            hide: !resource.jsonData.spec?.version,
          },
          {
            name: 'Suspend',
            value: resource.jsonData.spec?.suspend ? 'True' : 'False',
          },
        ];

        if (!resource.jsonData.spec?.suspend && resource.jsonData.spec?.interval) {
          info.push({
            name: 'Next Reconciliation',
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

function ArtifactTable(props) {
  const { artifact } = props;
  if (!artifact) {
    return null;
  }
  return (
    <SectionBox title="Artifact">
      <NameValueTable
        rows={[
          {
            name: 'Digest',
            value: artifact.digest,
          },
          {
            name: 'Last Updated Time',
            value: <DateLabel date={artifact.lastUpdateTime} />,
          },
          {
            name: 'Path',
            value: artifact.path,
          },
          {
            name: 'Revision',
            value: artifact.revision,
          },
          {
            name: 'Size',
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
