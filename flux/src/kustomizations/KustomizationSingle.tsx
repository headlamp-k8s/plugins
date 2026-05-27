import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
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
  const { t } = useTranslation();

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
            name: t('Status'),
            value: <StatusLabel item={item} />,
          },
          {
            name: t('Force'),
            value: item.jsonData?.spec?.force?.toString() || 'false',
          },
          {
            name: t('Path'),
            value: item.jsonData?.spec?.path,
          },
          {
            name: t('Prune'),
            value: item.jsonData?.spec?.prune?.toString() || 'false',
          },
          {
            name: t('Source Ref'),
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
            name: t('Suspend'),
            value: item.jsonData?.spec?.suspend ? t('True') : t('False'),
          },
          {
            name: t('Interval'),
            value: item.jsonData?.spec?.interval,
          },
          {
            name: t('Next Reconciliation'),
            value: <RemainingTimeDisplay item={item} />,
            hide: !!item.jsonData?.spec?.suspend,
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
              <SectionBox title={t('Values')}>
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
              <SectionBox title={t('Inventory')}>
                <GetResourcesFromInventory inventory={item.jsonData?.status?.inventory?.entries} />
              </SectionBox>
            ),
          },
          {
            id: 'flux.kustomization-dependencies',
            section: item.jsonData?.spec?.dependsOn && (
              <SectionBox title={t('Dependencies')}>
                <Table
                  data={item.jsonData?.spec?.dependsOn}
                  columns={[
                    {
                      header: t('Name'),
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
                      header: t('Namespace'),
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
