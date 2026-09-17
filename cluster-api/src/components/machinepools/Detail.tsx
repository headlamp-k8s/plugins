import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  ConditionsSection,
  DetailsGrid,
  EmptyContent,
  Link,
  Loader,
  NameValueTableRow,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { MachinePool } from '../../resources/machinepool';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { getMachinePoolActions } from '../actions';
import {
  OwnedMachinesSection,
  renderReplicas,
  showReplicas,
  TemplateSection,
} from '../common/index';
import { getPhaseStatus } from '../common/util';

type MachinePoolNode = { kubeObject: MachinePool };

interface MachinePoolDetailContentProps {
  crName: string;
  namespace?: string;
  crdName: string;
}

interface MachinePoolDetailContentPropsWithVersion extends MachinePoolDetailContentProps {
  VersionedMachinePool: typeof MachinePool;
  apiVersion: string;
}

/**
 * Main detail view for a MachinePool resource.
 * @see https://cluster-api.sigs.k8s.io/tasks/experimental-features/machine-pools
 *
 * @param props - Component properties including optional node from a list.
 */
export function MachinePoolDetail({ node }: { node?: MachinePoolNode }) {
  const { t } = useTranslation();
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();
  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;

  if (!crName) return <EmptyContent color="error">{t('Missing resource name')}</EmptyContent>;

  return (
    <MachinePoolDetailContent crName={crName} namespace={namespace} crdName={MachinePool.crdName} />
  );
}
/**
 * Renders the final MachinePool detail view with all fetched data.
 *
 * @param props - Component properties including the versioned class and version.
 */
function MachinePoolDetailContentWithData({
  crName,
  namespace,
  crdName,
  VersionedMachinePool,
}: MachinePoolDetailContentPropsWithVersion) {
  const { t } = useTranslation();
  const [crd] = CustomResourceDefinition.useGet(crdName, undefined);

  const [item, itemError] = VersionedMachinePool.useGet(crName, namespace ?? undefined);

  if (itemError && !item) {
    return (
      <EmptyContent color="error">
        {t('Error loading MachinePool {{crName}}: {{message}}', {
          crName,
          message: itemError?.message,
        })}
      </EmptyContent>
    );
  }
  if (!item) return <Loader title={t('Loading MachinePool details')} />;
  const spec = item.spec;
  const status = item.status;
  const initialization = item.initialization;

  const extraInfo: NameValueTableRow[] = [
    {
      name: t('Definition'),
      value: (
        <Link routeName="crd" params={{ name: crdName }}>
          {crdName}
        </Link>
      ),
      hide: !crd,
    },
    {
      name: t('Cluster'),
      value: spec?.clusterName ?? '-',
    },
    {
      name: t('Replicas'),
      value: renderReplicas(item, t),
      hide: !showReplicas(item),
    },
    {
      name: t('Phase'),
      value: (
        <StatusLabel status={getPhaseStatus(item.status?.phase)}>{item.status?.phase}</StatusLabel>
      ),
      hide: !item.status?.phase,
    },
    {
      name: t('Bootstrap Initialized'),
      value: initialization?.bootstrapDataSecretCreated ? 'True' : 'False',
      hide: initialization?.bootstrapDataSecretCreated === undefined,
    },
    {
      name: t('Infrastructure Ready'),
      value: initialization?.infrastructureProvisioned ? 'True' : 'False',
      hide: initialization?.infrastructureProvisioned === undefined,
    },
    {
      name: t('Min Ready Seconds'),
      value: spec?.minReadySeconds ?? 0,
    },
    {
      name: t('Observed Generation'),
      value:
        status?.observedGeneration !== undefined
          ? `${status.observedGeneration} / ${item.metadata?.generation ?? '-'}`
          : '-',
      hide: status?.observedGeneration === undefined,
    },
  ];
  return (
    <>
      <DetailsGrid
        resourceType={VersionedMachinePool}
        withEvents
        name={crName}
        namespace={namespace}
        actions={mp => (mp ? getMachinePoolActions(mp) : [])}
        extraInfo={() => extraInfo}
        extraSections={(mp: MachinePool) => [
          {
            id: 'cluster-api.machine-pool-machines',
            section: (
              <OwnedMachinesSection resource={mp} hideColumns={['owner']} showCreateButton />
            ),
          },
          {
            id: 'cluster-api.machine-pool-template',
            section: (
              <SectionBox title={t('Machine Template')}>
                <TemplateSection item={mp} />
              </SectionBox>
            ),
          },
          {
            id: 'cluster-api.machine-pool-conditions',
            section: (
              <ConditionsSection
                resource={{
                  ...mp.jsonData,
                  status: {
                    ...mp.jsonData.status,
                    conditions: mp.conditions,
                  },
                }}
              />
            ),
          },
        ]}
      />
    </>
  );
}
/**
 * Data-fetching wrapper that detects the correct CAPI API version for a MachinePool.
 *
 * @param props - Component properties.
 */
function MachinePoolDetailContent(props: MachinePoolDetailContentProps) {
  const { t } = useTranslation();
  const { crdName } = props;
  const apiVersion = useCapiApiVersion(crdName, 'v1beta1');
  const VersionedMachinePool = useMemo(
    () => (apiVersion ? MachinePool.withApiVersion(apiVersion) : MachinePool),
    [apiVersion]
  );
  if (!apiVersion) return <Loader title={t('Detecting Cluster API version')} />;
  return (
    <MachinePoolDetailContentWithData
      {...props}
      VersionedMachinePool={VersionedMachinePool}
      apiVersion={apiVersion}
    />
  );
}
