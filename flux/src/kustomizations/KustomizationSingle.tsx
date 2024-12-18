import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  ConditionsTable,
  Link,
  MainInfoSection,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Event, { KubeEvent } from '@kinvolk/headlamp-plugin/lib/K8s/event';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import Editor from '@monaco-editor/react';
import React from 'react';
import { useParams } from 'react-router-dom';
import YAML from 'yaml';
import {
  ForceReconciliationAction,
  ResumeAction,
  SuspendAction,
  SyncWithoutSourceAction,
  SyncWithSourceAction,
} from '../actions/index';
import RemainingTimeDisplay from '../common/RemainingTimeDisplay';
import StatusLabel from '../common/StatusLabel';
import Table from '../common/Table';
import { getSourceNameAndType, ObjectEvents } from '../helpers/index';
import { GetResourcesFromInventory, KUSTOMIZE_CRD } from '../inventory';

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

function GetSource(props: { item: KubeObject | null; setSource: (...args) => void }) {
  const { item, setSource } = props;
  const namespace = item.jsonData.metadata.namespace;

  const { name, type } = getSourceNameAndType(item);

  const [resource] = K8s.ResourceClasses.CustomResourceDefinition.useGet(
    `${type.split(' ').join('').toLowerCase()}.source.toolkit.fluxcd.io`
  );
  return (
    resource && (
      <GetSourceCR name={name} namespace={namespace} resource={resource} setSource={setSource} />
    )
  );
}

export default function FluxKustomizationDetailView() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();

  const [events] = Event?.default.useList({
    namespace,
    fieldSelector: `involvedObject.name=${name},involvedObject.kind=${'Kustomization'}`,
  });
  const [resource] = K8s.ResourceClasses.CustomResourceDefinition.useGet(KUSTOMIZE_CRD);

  return (
    <>
      {resource && <CustomResourceDetails resource={resource} name={name} namespace={namespace} />}
      <ObjectEvents events={events?.map((event: KubeEvent) => new Event.default(event))} />
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
    if (!cr) {
      return [];
    }
    const { name: sourceName, type: sourceType } = getSourceNameAndType(cr);
    const extraInfo = [
      {
        name: 'Status',
        value: <StatusLabel item={cr} />,
      },
      {
        name: 'Force',
        value: cr?.jsonData.spec?.force.toString(),
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
        value: (
          <Link
            routeName={`/flux/sources/:type/:namespace/:name`}
            params={{
              namespace: cr?.jsonData?.metadata?.namespace,
              type: sourceType,
              name: sourceName,
            }}
          >
            {sourceName}
          </Link>
        ),
      },
    ];
    extraInfo.push({
      name: 'Suspend',
      value: cr?.jsonData.spec?.suspend ? 'True' : 'False',
    });

    const interval = cr?.jsonData.spec?.interval;
    extraInfo.push({
      name: 'Interval',
      value: interval,
    });

    if (!cr?.jsonData.spec?.suspend) {
      extraInfo.push({
        name: 'Next Reconciliation',
        value: <RemainingTimeDisplay item={cr} />,
      });
    }
    return extraInfo;
  }

  function prepareActions() {
    const actions = [];
    actions.push(<SyncWithSourceAction resource={cr} source={source} />);
    actions.push(<SyncWithoutSourceAction resource={cr} />);
    actions.push(<SuspendAction resource={cr} />);
    actions.push(<ResumeAction resource={cr} />);
    actions.push(<ForceReconciliationAction resource={cr} />);

    return actions;
  }

  const themeName = localStorage.getItem('headlampThemePreference');

  return (
    <>
      {cr && <GetSource item={cr} setSource={setSource} />}
        <MainInfoSection
          resource={cr}
          extraInfo={prepareExtraInfo(cr)}
          actions={prepareActions()}
        />
      {cr?.jsonData?.spec?.values && (
        <SectionBox title="Values">
          <Editor
            language="yaml"
            value={YAML.stringify(cr?.jsonData?.spec?.values)}
            height={200}
            theme={themeName === 'dark' ? 'vs-dark' : 'light'}
          />
        </SectionBox>
      )}
      {cr &&
        <>
          <SectionBox title="Inventory">
            <GetResourcesFromInventory inventory={cr?.jsonData?.status?.inventory?.entries} />
          </SectionBox>
          <SectionBox title="Dependencies">
            <Table
              data={cr?.jsonData?.spec?.dependsOn}
              columns={[
                {
                  header: 'Name',
                  accessorFn: item => {
                    return (
                      <Link
                        routeName={`/flux/kustomizations/:namespace/:name`}
                        params={{
                          name: item.name,
                          namespace: item.namespace || namespace,
                        }}
                      >
                        {item.name}
                      </Link>
                    );
                  },
                },
                {
                  header: 'Namespace',
                  accessorFn: item => (
                    <Link routeName={`namespace`} params={{ name: item.namespace || namespace }}>
                      {item.namespace || namespace}
                    </Link>
                  ),
                },
              ]}
            />
          </SectionBox>
          <SectionBox title="Conditions">
            <ConditionsTable resource={cr?.jsonData} />
          </SectionBox>
        </>
      }
    </>
  );
}
