import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  ConditionsTable,
  DateLabel,
  MainInfoSection,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Event from '@kinvolk/headlamp-plugin/lib/K8s/event';
import React from 'react';
import { useParams } from 'react-router-dom';
import { ResumeAction, SuspendAction, SyncAction } from '../actions/index';
import Link from '../common/Link';
import RemainingTimeDisplay from '../common/RemainingTimeDisplay';
import StatusLabel from '../common/StatusLabel';
import { ObjectEvents } from '../helpers/index';

export default function FluxSourceDetailView() {
  const { namespace, type, name } = useParams<{ namespace: string; type: string; name: string }>();

  const [resource] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
    `${type.split(' ').join('').toLowerCase()}.source.toolkit.fluxcd.io`
  );

  return (
    resource && <CustomResourceDetailView name={name} namespace={namespace} resource={resource} />
  );
}

function CustomResourceDetailView(props) {
  const { name, namespace, resource } = props;
  const [cr, setCr] = React.useState(null);
  const resourceClass = React.useMemo(() => {
    return resource.makeCRClass();
  }, [resource]);

  resourceClass.useApiGet(setCr, name, namespace);

  function prepareExtraInfo() {
    const interval = cr?.jsonData.spec?.interval;
    const extraInfo = [
      {
        name: 'Status',
        value: <StatusLabel item={cr} />,
      },
      {
        name: 'Interval',
        value: interval,
      },
      {
        name: 'Ref',
        value: cr?.jsonData.spec?.ref && JSON.stringify(cr?.jsonData.spec?.ref),
      },
      {
        name: 'Timeout',
        value: cr?.jsonData.spec?.timeout,
      },
      {
        name: 'URL',
        value: <Link url={cr?.jsonData.spec?.url} />,
        hide: !cr?.jsonData.spec?.url,
      },
      {
        name: 'Chart',
        hide: !cr?.jsonData.spec?.chart,
        value: cr?.jsonData.spec?.chart,
      },
      {
        name: 'Source Ref',
        hide: !cr?.jsonData.spec?.sourceRef,
        value: cr?.jsonData.spec?.sourceRef && JSON.stringify(cr?.jsonData.spec?.sourceRef),
      },
      {
        name: 'Version',
        value: cr?.jsonData.spec?.version,
        hide: !cr?.jsonData.spec?.version,
      },
      {
        name: 'Suspend',
        value: cr?.jsonData.spec?.suspend ? 'True' : 'False',
      },
    ];

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
        actions={[
          <SyncAction resource={cr} />,
          <SuspendAction resource={cr} />,
          <ResumeAction resource={cr} />,
        ]}
        extraInfo={prepareExtraInfo()}
      />
      {cr && <Events namespace={namespace} name={name} cr={cr} />}
      {cr && (
        <SectionBox title="Conditions">
          <ConditionsTable resource={cr?.jsonData} showLastUpdate={false} />
        </SectionBox>
      )}

      {cr && <ArtifactTable artifact={cr?.jsonData?.status?.artifact} />}
    </>
  );
}

function Events(props) {
  const { cr } = props;
  const [events] = Event?.default.useList({
    namespace: cr?.jsonData.metadata.namespace,
    fieldSelector: `involvedObject.name=${cr?.jsonData.metadata.name},involvedObject.kind=${cr?.jsonData.kind}`,
  });

  return <ObjectEvents events={events} />;
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
