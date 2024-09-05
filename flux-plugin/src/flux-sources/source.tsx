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
  Link
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Link as MuiLink } from '@mui/material';
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

  function prepareExtraInfo() {
    const extraInfo = [];
    extraInfo.push({
      name: 'Interval',
      value: cr?.jsonData.spec?.interval,
    })
    extraInfo.push({
      name: 'Ref',
      value: cr?.jsonData.spec?.ref && JSON.stringify(cr?.jsonData.spec?.ref),
    })
    extraInfo.push({
      name: 'Timeout',
      value: cr?.jsonData.spec?.timeout,
    })
    extraInfo.push({
      name: 'URL',
      value: cr?.jsonData.spec?.url && <MuiLink href={cr?.jsonData.spec?.url}>{cr?.jsonData.spec?.url}</MuiLink>,
      hide: !cr?.jsonData.spec?.url,
    })

    if(cr?.jsonData.spec?.chart) {
      extraInfo.push({
        name: 'Chart',
        value: cr?.jsonData.spec?.chart,
      })
    }
    extraInfo.push({
      name: 'Source Ref',
      value: cr?.jsonData.spec?.sourceRef && <Link routeName={`/flux/sources/:namespace/:type/:name`} params={{ namespace: cr.jsonData.metadata.namespace, type: cr.jsonData.spec.sourceRef.kind, name: cr.jsonData.spec.sourceRef.name }}>{cr.jsonData.spec.sourceRef.name}</Link>,
    })

    extraInfo.push({
      name: 'Version',
      value: cr?.jsonData.spec?.version,
    })

    extraInfo.push({
      name: 'Suspend',
      value: cr?.jsonData.spec?.suspend ? 'True' : 'False',
    })


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
            header: 'From',
            accessorFn: item => item.jsonData.reportingComponent || '-',
          },
          {
            header: 'Age',
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
