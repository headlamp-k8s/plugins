import { useLocation } from 'react-router';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import {
  ConditionsTable,
  DateLabel,
  MainInfoSection,
  NameValueTable,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Link } from '@mui/material';

import Event from '@kinvolk/headlamp-plugin/lib/K8s/event';
import { SuspendAction, ResumeAction, SyncAction } from '../actions/index';

export default function FluxSourceDetailView(props) {
  const location = useLocation();
  const segments = location.pathname.split('/');
  // The fourth last segment is the kind
  const namespace = segments[segments.length - 3];
  // The second last segment is the type
  const type = segments[segments.length - 2];
  // The last segment is the name
  const name = segments[segments.length - 1];
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

  return (
    <>
      <MainInfoSection
        resource={cr}
        actions={[
          <SyncAction resource={cr} />,
          <SuspendAction resource={cr} />,
          <ResumeAction resource={cr} />,
        ]}
        extraInfo={[
          {
            name: 'Interval',
            value: cr?.jsonData.spec?.interval,
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
            value: cr?.jsonData.spec?.url && (
              <Link href={cr?.jsonData.spec?.url}>{cr?.jsonData.spec?.url}</Link>
            ),
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
        ]}
      />
      {cr && <Events namespace={namespace} name={name} cr={cr} />}
      {cr && (
        <SectionBox title="Conditions">
          <ConditionsTable resource={cr?.jsonData} showLastUpdate={false} />
        </SectionBox>
      )}

      {cr && <ArtifactTable artifact={cr?.jsonData.status?.artifact} />}
    </>
  );
}

function Events(props) {
  const { namespace, name, cr } = props;
  const [events] = Event?.default.objectEvents({
    name: name,
    namespace: namespace,
    kind: cr?.jsonData.kind,
  });

  return (
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
            header: 'Message',
            accessorFn: item => item.message,
          },
          {
            header: 'Last Updated Time',
            accessorFn: item => <DateLabel date={item.jsonData.lastTimestamp} />,
          },
        ]}
      />
    </SectionBox>
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
            value: artifact.url,
          },
        ]}
      />
    </SectionBox>
  );
}
