import {
  ConditionsSection,
  DetailsGrid,
  Link,
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
import { Kustomization } from '../common/Resources';
import StatusLabel from '../common/StatusLabel';
import Table from '../common/Table';
import { getSourceNameAndPluralKind } from '../helpers/index';
import { GetResourcesFromInventory } from './Inventory';

export function FluxKustomizationDetailView(props: { name?: string; namespace?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { name = params.name, namespace = params.namespace } = props;

  return (
    <DetailsGrid
      resourceType={Kustomization}
      name={name}
      namespace={namespace}
      withEvents
      actions={(resource: Kustomization) => {
        if (!resource) return [];
        return [
          <SyncWithSourceAction resource={resource} />,
          <SyncWithoutSourceAction resource={resource} />,
          <SuspendAction resource={resource} />,
          <ResumeAction resource={resource} />,
          <ForceReconciliationAction resource={resource} />,
        ];
      }}
      extraInfo={(item: Kustomization) => {
        if (!item) return [];
        const {
          name: sourceName,
          pluralKind: sourceType,
          namespace: sourceNamespace,
        } = getSourceNameAndPluralKind(item);

        return [
          {
            name: 'Status',
            value: <StatusLabel item={item} />,
          },
          {
            name: 'Force',
            value: item.jsonData.spec?.force?.toString() || 'false',
          },
          {
            name: 'Path',
            value: item.jsonData.spec?.path,
          },
          {
            name: 'Prune',
            value: item.jsonData.spec?.prune?.toString() || 'false',
          },
          {
            name: 'SourceRef',
            value: (
              <Link
                routeName="source"
                params={{
                  namespace: sourceNamespace ?? item.metadata.namespace,
                  pluralName: sourceType,
                  name: sourceName,
                }}
              >
                {sourceName}
              </Link>
            ),
          },
          {
            name: 'Suspend',
            value: item.jsonData.spec?.suspend ? 'True' : 'False',
          },
          {
            name: 'Interval',
            value: item.jsonData.spec?.interval,
          },
          {
            name: 'Next Reconciliation',
            value: <RemainingTimeDisplay item={item} />,
            hide: !!item.jsonData.spec?.suspend,
          },
        ];
      }}
      extraSections={(item: Kustomization) => {
        if (!item) return [];
        const themeName = localStorage.getItem('headlampThemePreference');

        return [
          {
            id: 'flux.kustomization-values',
            section: item.jsonData?.spec?.values && (
              <SectionBox title="Values">
                <Editor
                  language="yaml"
                  value={YAML.stringify(item.jsonData?.spec?.values)}
                  height={200}
                  theme={themeName === 'dark' ? 'vs-dark' : 'light'}
                />
              </SectionBox>
            ),
          },
          {
            id: 'flux.kustomization-inventory',
            section: (
              <SectionBox title="Inventory">
                <GetResourcesFromInventory inventory={item.jsonData?.status?.inventory?.entries} />
              </SectionBox>
            ),
          },
          {
            id: 'flux.kustomization-dependencies',
            section: item.jsonData?.spec?.dependsOn && (
              <SectionBox title="Dependencies">
                <Table
                  data={item.jsonData?.spec?.dependsOn}
                  columns={[
                    {
                      header: 'Name',
                      accessorFn: dep => (
                        <Link
                          routeName="kustomize"
                          params={{
                            name: dep.name,
                            namespace: dep.namespace || item.metadata.namespace,
                          }}
                        >
                          {dep.name}
                        </Link>
                      ),
                    },
                    {
                      header: 'Namespace',
                      accessorFn: dep => (
                        <Link
                          routeName="namespace"
                          params={{ name: dep.namespace || item.metadata.namespace }}
                        >
                          {dep.namespace || item.metadata.namespace}
                        </Link>
                      ),
                    },
                  ]}
                />
              </SectionBox>
            ),
          },
          {
            id: 'flux.kustomization-conditions',
            section: <ConditionsSection resource={item.jsonData} />,
          },
        ];
      }}
    />
  );
}
