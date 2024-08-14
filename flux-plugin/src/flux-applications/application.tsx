import {
  ConditionsTable,
  DateLabel,
  Link,
  MainInfoSection,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useLocation } from 'react-router';
import Event from '@kinvolk/headlamp-plugin/lib/K8s/event';
import React from 'react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  SuspendAction,
  ResumeAction,
  SyncWithSourceAction,
  SyncWithoutSourceAction,
} from '../actions/index';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';

const KUSTOMIZE_CRD = 'kustomizations.kustomize.toolkit.fluxcd.io';
const HELMRELEASE_CRD = 'helmreleases.helm.toolkit.fluxcd.io';

function GetResourcesFromInventory(props: {
  inventory: {
    id: string;
    v: string;
  }[];
}) {
  const [resources, setResources] = React.useState([]);
  function parseID(id: string) {
    /* ID is the string representation of the Kubernetes resource object's
    metadata,
    in the format '<namespace>_<name>_<group>_<kind>'.
    */
    const parsedID = id.split('_');
    const namespace = parsedID[0];
    const name = parsedID[1];
    const group = parsedID[2];
    const kind = parsedID[3];
    return { namespace, name, group, kind };
  }

  props.inventory?.map(item => {
    const parsedID = parseID(item.id);
    const { namespace, name, group, kind } = parsedID;
    const resource = K8s.ResourceClasses[kind];


    if (!resource) {
      return;
    }
    resource.useApiGet(
      data => {
        // if the resource already exist replace it with the new one which is data otherwise add it
        // use uid as the filter
        const index = resources.findIndex(it => it.metadata.uid === data.metadata.uid);
        if (index !== -1) {
          resources[index] = data;
        } else {
          resources.push(data);
        }
        setResources([...resources]);
      },
      name,
      namespace
    );
  });

  return (
    <Table
      data={resources}
      columns={[
        {
          header: 'Name',
          accessorFn: item => <Link kubeObject={item}>{item.metadata.name}</Link>,
        },
        {
          header: 'Namespace',
          accessorFn: item =>
            item.metadata.namespace ? (
              <Link
                routeName={`namespace`}
                params={{
                  name: item.metadata.namespace,
                }}
              >
                {item.metadata.namespace}
              </Link>
            ) : (
              ''
            ),
        },
        {
          header: 'Kind',
          accessorFn: item => item.kind,
        },
        {
          header: 'Ready',
          accessorFn: item => {
            const ready =
              item.jsonData.status?.conditions?.findIndex(c => c.type === 'Ready') !== -1
                ? 'True'
                : 'False';
            return ready;
          },
        },
        {
          header: 'Age',
          accessorFn: item => <DateLabel date={item.metadata.creationTimestamp} />,
        },
      ]}
    />
  );
}

function GetSourceCR(props: {
  name: string;
  namespace: string;
  resource: KubeObject | null;
  setSource: (...args) => void;
}) {
  const { name, namespace, resource, setSource } = props;
  //const [openDialog, setOpenDialog] = React.useState(false);
  const resourceClass = React.useMemo(() => {
    return resource.makeCRClass();
  }, [resource]);

  resourceClass.useApiGet(setSource, name, namespace);

  return null;
}

function GetSource(props: {
  item: KubeObject | null;
  setSource: (...args) => void;
}) {
  const { item, setSource } = props;
  let name = '';
  let type = '';
  const namespace = item.jsonData.metadata.namespace;
    
  function getNameAndType() {
    const itemKind = item.jsonData.kind;

    if (itemKind === 'Kustomization') {
      switch (item.jsonData.spec.sourceRef.kind) {
        case 'GitRepository':
          type = 'gitrepositories';
          break;
        case 'OCIRepository':
          type = 'ocirepositories';
          break;
        case 'Bucket':
          type = 'buckets';
          break;
        default:
          type = 'sources';
      }
      name = item.jsonData.spec?.sourceRef?.name;
    } else if (itemKind === 'HelmRelease') {
      switch (item.jsonData.spec.chart.spec.sourceRef.kind) {
        case 'HelmRepository':
          type = 'helmrepositories';
          break;
        case 'HelmChart':
          type = 'helmcharts';
          break;
        default:
          type = 'sources';
      }
      name = item.jsonData?.spec?.chart?.spec?.sourceRef?.name;
    }
  }
  getNameAndType();

  const [resource] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
    `${type.split(' ').join('').toLowerCase()}.source.toolkit.fluxcd.io`
  );
  return resource && <GetSourceCR name={name} namespace={namespace} resource={resource} setSource={setSource}/>
}


export default function FluxApplicationDetailView(props) {
  const location = useLocation();
  const segments = location.pathname.split('/');
  // The fourth last segment is the kind
  const namespace = segments[segments.length - 3];
  // The second last segment is the type
  const type = segments[segments.length - 2];
  // The last segment is the name
  const name = segments[segments.length - 1];


  const [events, error] = Event?.default.objectEvents({
    namespace: namespace,
    kind: type === 'helmreleases' ? 'HelmRelease' : 'Kustomization',
    name: name,
  });

  const [resource] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
    type === 'helmreleases' ? HELMRELEASE_CRD : KUSTOMIZE_CRD
  );

  return (
    <>
      {resource && <CustomResourceDetails resource={resource} name={name} namespace={namespace} />}
      <SectionBox title="Events">
        <Table
          data={events}
          columns={[
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
              accessorFn: item => item.source.component,
            },
            {
              header: 'Last Updated',
              accessorFn: item => <DateLabel date={item.jsonData.lastTimestamp} />,
            },
          ]}
        />
      </SectionBox>
    </>
  );
}

function CustomResourceDetails(props) {
  const { name, namespace, resource } = props;
  const [cr, setCr] = React.useState(null);
  const [source, setSource] = React.useState(null);
  const resourceClass = React.useMemo(() => {
    return resource.makeCRClass();
  }, [resource]);

  resourceClass.useApiGet(setCr, name, namespace);

  function prepareExtraInfo(cr) {
    let extraInfo = [];

    if (cr?.jsonData.kind === 'HelmRelease') {
      extraInfo.push({
        name: 'Chart',
        value: cr?.jsonData?.spec?.chart?.spec?.chart,
      });

      extraInfo.push({
        name: 'Reconcile Strategy',
        value: cr?.jsonData?.spec.chart?.spec?.reconcileStrategy,
      });

      extraInfo.push({
        name: 'Source Ref',
        value:
          cr?.jsonData?.spec.chart?.spec?.sourceRef &&
          JSON.stringify(cr?.jsonData?.spec.chart?.spec?.sourceRef),
      });

      const values = cr?.jsonData?.spec.values;
      if (values) {
        for (const [key, value] of Object.entries(values)) {
          extraInfo.push({
            name: key,
            value: value,
          });
        }
      }
    } else {
      extraInfo = [
        {
          name: 'Force',
          value: cr?.jsonData.spec?.force,
        },
        {
          name: 'Path',
          value: cr?.jsonData.spec?.path,
        },
        {
          name: 'Prune',
          value: cr?.jsonData.spec?.prune,
        },
        {
          name: 'SourceRef',
          value: cr?.jsonData.spec?.sourceRef && JSON.stringify(cr?.jsonData.spec?.sourceRef),
        },
      ];
    }
    extraInfo.push({
      name: 'Suspend',
      value: cr?.jsonData.spec?.suspend ? 'True' : 'False',
    });
    extraInfo.push({
      name: 'Interval',
      value: cr?.jsonData.spec?.interval,
    });
    return extraInfo;
  }

  const inventories = cr?.jsonData?.status?.inventory?.entries;

  function findDeployment() {
    const deployment = inventories?.find(inventory =>
      inventory.id.toLowerCase().includes('deployment')
    );
    const parsedDeployment = deployment?.id.split('_');
    const namespace = parsedDeployment?.[0];
    const name = parsedDeployment?.[1];
    return name;
  }
  findDeployment();
  const mapsource = React.useMemo(() => {
    const temp: GraphSource = {
      id: 'applications',
      label: 'Applications',
      nodes: () =>
        cr
          ? [
              {
                id: cr?.jsonData.metadata.uid,
                type: 'kubeObject',
                data: {
                  resource: cr,
                },
              },
            ]
          : [],
      edges: ({ resources }) => {
        const deployment = resources.deployments.find(it => it.metadata.name === findDeployment());

        return deployment
          ? [{ id: 'myid', source: cr.metadata.uid, target: deployment.metadata.uid }]
          : [];
      },
    };
    return temp;
  }, [cr]);

  function prepareActions() {
    const actions = [];
    actions.push(<SyncWithSourceAction resource={cr} source={source}/>);
    actions.push(<SyncWithoutSourceAction resource={cr} />);
    actions.push(<SuspendAction resource={cr} />);
    actions.push(<ResumeAction resource={cr} />);
    return actions;
  }
  return (
    <>
     { cr && <GetSource item={cr} setSource={setSource}/> }
     { cr && <MainInfoSection
        resource={cr}
        extraInfo={prepareExtraInfo(cr)}
        actions={prepareActions()}
      />
     }
      {cr && (
        <SectionBox title="Inventory">
          <GetResourcesFromInventory inventory={cr?.jsonData.status?.inventory?.entries} />
        </SectionBox>
      )}
      <SectionBox title="Dependencies">
        <Table
          data={cr?.jsonData.spec?.dependsOn}
          columns={[
            {
              header: 'Name',
              accessorFn: item => item.name,
            },
            {
              header: 'Kind',
              accessorFn: item => item.kind,
            },
          ]}
        />
      </SectionBox>
      <SectionBox title="Graph">
        <GraphView
          hideHeader
          height="400px"
          groupingOptions={{ disable: true }}
          defaultSources={[mapsource, WorkloadsSource]}
          defaultFilters={[{ type: 'related', id: cr?.metadata?.uid }]}
        />
      </SectionBox>
      <SectionBox title="Conditions">
        <ConditionsTable resource={cr?.jsonData} />
      </SectionBox>
    </>
  );
}
