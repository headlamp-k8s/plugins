import {
  ConditionsTable,
  Link,
  MainInfoSection,
  SectionBox,
  Table,
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
import { getSourceNameAndPluralKind, ObjectEvents } from '../helpers/index';
import { GetSource } from '../sources/Source';
import { helmReleaseClass } from './HelmReleaseList';
import { HelmInventory } from './Inventory';

export function FluxHelmReleaseDetailView(props: { name?: string; namespace?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { name = params.name, namespace = params.namespace } = props;

  return (
    <>
      <CustomResourceDetails name={name} namespace={namespace} />
      <ObjectEvents name={name} namespace={namespace} resourceClass={helmReleaseClass()} />
    </>
  );
}

function CustomResourceDetails(props) {
  const { name, namespace } = props;
  const [cr, setCr] = React.useState(null);
  const [source, setSource] = React.useState(null);

  helmReleaseClass().useApiGet(setCr, name, namespace);

  function prepareExtraInfo(cr) {
    if (!cr) {
      return [];
    }
    const {
      name: sourceName,
      pluralKind: sourcePluralKind,
      namespace: sourceNamespace,
    } = getSourceNameAndPluralKind(cr);
    const extraInfo = [
      {
        name: 'Status',
        value: <StatusLabel item={cr} />,
      },
      {
        name: 'Chart',
        value: sourceName,
      },
      {
        name: 'Reconcile Strategy',
        value: cr?.jsonData?.spec.chart?.spec?.reconcileStrategy,
      },
    ];

    if (cr?.jsonData?.spec?.chartRef) {
      extraInfo.push({
        name: 'Source Ref',
        value: (
          <Link
            routeName="source"
            params={{
              namespace: sourceNamespace ?? cr.jsonData.metadata?.namespace,
              name: sourceName,
              pluralName: sourcePluralKind,
            }}
          >
            {sourceName}
          </Link>
        ),
      });
    }

    if (cr?.jsonData?.spec?.chart?.spec?.sourceRef) {
      extraInfo.push({
        name: 'Source Ref',
        value: (
          <Link
            routeName="source"
            params={{
              name: sourceName,
              namespace: sourceNamespace ?? cr.jsonData.metadata?.namespace,
              pluralName: sourcePluralKind,
            }}
          >
            {sourceName}
          </Link>
        ),
      });
    }
    extraInfo.push({
      name: 'Version',
      value: cr?.jsonData?.spec.chart?.spec?.version,
    });
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
      {cr && (
        <MainInfoSection
          resource={cr}
          extraInfo={prepareExtraInfo(cr)}
          actions={prepareActions()}
        />
      )}
      {cr && cr?.jsonData?.spec?.values && (
        <SectionBox title="Values">
          <Editor
            language="yaml"
            value={YAML.stringify(cr?.jsonData?.spec?.values)}
            height={200}
            theme={themeName === 'dark' ? 'vs-dark' : 'light'}
          />
        </SectionBox>
      )}

      <SectionBox title="Inventory">
        <HelmInventory name={name} namespace={namespace} />
      </SectionBox>

      <SectionBox title="Dependencies">
        <Table
          data={cr?.jsonData?.spec?.dependsOn}
          columns={[
            {
              header: 'Name',
              accessorFn: item => (
                <Link
                  routeName="helm"
                  params={{
                    name: item.name,
                    namespace: item.namespace || namespace,
                  }}
                >
                  {item.name}
                </Link>
              ),
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
  );
}
