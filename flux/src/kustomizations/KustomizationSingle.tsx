import {
  ConditionsTable,
  Link,
  MainInfoSection,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
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
import { getSourceNameAndPluralKind, ObjectEvents } from '../helpers/index';
import { GetSource } from '../sources/Source';
import { GetResourcesFromInventory } from './Inventory';
import { kustomizationClass } from './KustomizationList';

export function FluxKustomizationDetailView(props: { name?: string; namespace?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { name = params.name, namespace = params.namespace } = props;

  return (
    <>
      <KustomizationDetails name={name} namespace={namespace} />
      <ObjectEvents name={name} namespace={namespace} resourceClass={kustomizationClass()} />
    </>
  );
}

function KustomizationDetails(props) {
  const { name, namespace } = props;
  const [cr, setCr] = React.useState(null);
  const [source, setSource] = React.useState(null);

  kustomizationClass().useApiGet(setCr, name, namespace);

  function prepareExtraInfo(cr) {
    if (!cr) {
      return [];
    }
    const {
      name: sourceName,
      pluralKind: sourceType,
      namespace: sourceNamespace,
    } = getSourceNameAndPluralKind(cr);
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
            routeName="source"
            params={{
              namespace: sourceNamespace ?? cr?.jsonData?.metadata?.namespace,
              pluralName: sourceType,
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
    if (!cr) {
      return [];
    }

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
      <MainInfoSection resource={cr} extraInfo={prepareExtraInfo(cr)} actions={prepareActions()} />
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
      {cr && (
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
                        routeName="kustomize"
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
                    <Link routeName="namespace" params={{ name: item.namespace || namespace }}>
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
      )}
    </>
  );
}
