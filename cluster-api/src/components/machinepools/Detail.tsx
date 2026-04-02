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
import {
  OwnedMachinesSection,
  renderReplicas,
  ScaleButton,
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

export function MachinePoolDetail({ node }: { node?: MachinePoolNode }) {
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();
  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;

  if (!crName) return <EmptyContent color="error">Missing resource name</EmptyContent>;

  return (
    <MachinePoolDetailContent crName={crName} namespace={namespace} crdName={MachinePool.crdName} />
  );
}
function MachinePoolDetailContentWithData({
  crName,
  namespace,
  crdName,
  VersionedMachinePool,
}: MachinePoolDetailContentPropsWithVersion) {
  const [crd] = CustomResourceDefinition.useGet(crdName, undefined);

  const [item, itemError] = VersionedMachinePool.useGet(crName, namespace ?? undefined);

  if (itemError && !item) {
    return (
      <EmptyContent color="error">
        Error loading MachinePool {crName}: {itemError?.message}
      </EmptyContent>
    );
  }
  if (!item) return <Loader title="Loading MachinePool details" />;
  const spec = item.spec;
  const status = item.status;
  const initialization = item.initialization;

  const extraInfo: NameValueTableRow[] = [
    {
      name: 'Definition',
      value: (
        <Link routeName="crd" params={{ name: crdName }}>
          {crdName}
        </Link>
      ),
      hide: !crd,
    },
    {
      name: 'Cluster',
      value: spec?.clusterName ?? '-',
    },
    {
      name: 'Replicas',
      value: renderReplicas(item),
      hide: !showReplicas(item),
    },
    {
      name: 'Phase',
      value: (
        <StatusLabel status={getPhaseStatus(item.status?.phase)}>{item.status?.phase}</StatusLabel>
      ),
      hide: !item.status?.phase,
    },
    {
      name: 'Bootstrap Initialized',
      value: initialization?.bootstrapDataSecretCreated ? 'True' : 'False',
      hide: initialization?.bootstrapDataSecretCreated === undefined,
    },
    {
      name: 'Infrastructure Ready',
      value: initialization?.infrastructureProvisioned ? 'True' : 'False',
      hide: initialization?.infrastructureProvisioned === undefined,
    },
    {
      name: 'Min Ready Seconds',
      value: spec?.minReadySeconds ?? 0,
    },
    {
      name: 'Observed Generation',
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
        actions={item => (item ? [<ScaleButton item={item} />] : [])}
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
              <SectionBox title="Machine Template">
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
function MachinePoolDetailContent(props: MachinePoolDetailContentProps) {
  const { crdName } = props;
  const apiVersion = useCapiApiVersion(crdName, 'v1beta1');
  const VersionedMachinePool = useMemo(
    () => (apiVersion ? MachinePool.withApiVersion(apiVersion) : MachinePool),
    [apiVersion]
  );
  if (!apiVersion) return <Loader title="Detecting Cluster API version" />;
  return (
    <MachinePoolDetailContentWithData
      {...props}
      VersionedMachinePool={VersionedMachinePool}
      apiVersion={apiVersion}
    />
  );
}
