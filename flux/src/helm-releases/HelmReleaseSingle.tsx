import { registerDetailsViewSection, useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  ConditionsSection,
  ConditionsTable,
  DetailsGrid,
  Link,
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
import { HelmRelease } from '../common/Resources';
import StatusLabel from '../common/StatusLabel';
import { getSourceNameAndPluralKind } from '../helpers/index';
import { HelmInventory } from './Inventory';

export function FluxHelmReleaseDetailView(props: { name?: string; namespace?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { name = params.name, namespace = params.namespace } = props;
  const { t } = useTranslation();

  return (
    <DetailsGrid
      resourceType={HelmRelease}
      name={name}
      namespace={namespace}
      withEvents
      actions={(resource: HelmRelease) => {
        if (!resource) return [];
        return [
          <SyncWithSourceAction resource={resource} />,
          <SyncWithoutSourceAction resource={resource} />,
          <SuspendAction resource={resource} />,
          <ResumeAction resource={resource} />,
          <ForceReconciliationAction resource={resource} />,
        ];
      }}
      extraInfo={(item: HelmRelease) => {
        if (!item) return [];
        const {
          name: sourceName,
          pluralKind: sourcePluralKind,
          namespace: sourceNamespace,
        } = getSourceNameAndPluralKind(item);

        const info: any[] = [
          {
            name: t('Status'),
            value: <StatusLabel item={item} />,
          },
          {
            name: t('Chart'),
            value: sourceName,
          },
          {
            name: t('Reconcile Strategy'),
            value: item.jsonData?.spec?.chart?.spec?.reconcileStrategy,
          },
        ];

        if (item.jsonData?.spec?.chartRef || item.jsonData?.spec?.chart?.spec?.sourceRef) {
          info.push({
            name: t('Source Ref'),
            value: (
              <Link
                routeName="source"
                params={{
                  namespace: sourceNamespace ?? item.metadata.namespace,
                  name: sourceName,
                  pluralName: sourcePluralKind,
                }}
              >
                {sourceName}
              </Link>
            ),
          });
        }

        info.push({
          name: t('Version'),
          value: item.jsonData?.spec?.chart?.spec?.version,
        });

        info.push({
          name: t('Suspend'),
          value: item.jsonData?.spec?.suspend ? t('True') : t('False'),
        });

        info.push({
          name: t('Interval'),
          value: item.jsonData?.spec?.interval,
        });

        if (!item.jsonData?.spec?.suspend) {
          info.push({
            name: t('Next Reconciliation'),
            value: <RemainingTimeDisplay item={item} />,
          });
        }

        return info;
      }}
      extraSections={(item: HelmRelease) => {
        if (!item) return [];
        const themeName = localStorage.getItem('headlampThemePreference');

        return [
          {
            id: 'flux.helmrelease-values',
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
            id: 'flux.helmrelease-inventory',
            section: (
              <SectionBox title={t('Inventory')}>
                <HelmInventory name={item.metadata.name} namespace={item.metadata.namespace} />
              </SectionBox>
            ),
          },
          {
            id: 'flux.helmrelease-dependencies',
            section: item.jsonData?.spec?.dependsOn && (
              <SectionBox title={t('Dependencies')}>
                <Table
                  data={item.jsonData?.spec?.dependsOn}
                  columns={[
                    {
                      header: t('Name'),
                      accessorFn: dep => (
                        <Link
                          routeName="helm"
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
            id: 'flux.helmrelease-conditions',
            section: <ConditionsSection resource={item.jsonData} />,
          },
        ];
      }}
    />
  );
}

export const registerHelmRelease = () => {
  registerDetailsViewSection(({ resource }: { resource: HelmRelease }) => {
    console.log('flux', { resource });
    if (resource.kind !== 'HelmRelease') return null;

    const themeName = localStorage.getItem('headlampThemePreference');

    const cr = resource;

    return (
      <>
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
          <HelmInventory name={resource.metadata.name} namespace={resource.metadata.namespace} />
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
                      namespace: item.namespace || resource.metadata.namespace,
                    }}
                  >
                    {item.name}
                  </Link>
                ),
              },
              {
                header: 'Namespace',
                accessorFn: item => (
                  <Link
                    routeName="namespace"
                    params={{ name: item.namespace || resource.metadata.namespace }}
                  >
                    {item.namespace || resource.metadata.namespace}
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
  });
};
