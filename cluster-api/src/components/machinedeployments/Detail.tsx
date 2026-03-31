import {
  ConditionsSection,
  DetailsGrid,
  EmptyContent,
  Link,
  Loader,
  MetadataDictGrid,
  type NameValueTableRow,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { MachineDeployment } from '../../resources/machinedeployment';
import { useCapiApiVersion } from '../../utils/capiVersion';
import {
  OwnedMachinesSection,
  renderReplicas,
  renderUpdateStrategy,
  ScaleButton,
  showReplicas,
  showUpdateStrategy,
  TemplateSection,
} from '../common/index';
import { renderConditionStatus } from '../common/util';
type MachineDeploymentNode = { kubeObject: MachineDeployment };

export function MachineDeploymentDetail({ node }: { node?: MachineDeploymentNode }) {
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();
  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;

  if (!crName) return <EmptyContent color="error">Missing resource name</EmptyContent>;

  return (
    <MachineDeploymentDetailContent
      crName={crName}
      namespace={namespace}
      crdName={MachineDeployment.crdName}
    />
  );
}

interface MachineDeploymentDetailContentProps {
  crName: string;
  namespace?: string;
  crdName: string;
}

interface MachineDeploymentDetailContentPropsWithVersion
  extends MachineDeploymentDetailContentProps {
  VersionedMachineDeployment: typeof MachineDeployment;
  apiVersion: string;
}

function MachineDeploymentDetailContentWithData({
  crName,
  namespace,
  crdName,
  VersionedMachineDeployment,
}: MachineDeploymentDetailContentPropsWithVersion) {
  const [crd] = CustomResourceDefinition.useGet(crdName, undefined);

  const [item, itemError] = VersionedMachineDeployment.useGet(crName, namespace ?? undefined);

  if (itemError && !item) {
    return (
      <EmptyContent color="error">
        Error loading MachineDeployment {crName}: {itemError?.message}
      </EmptyContent>
    );
  }
  if (!item) return <Loader title="Loading MachineDeployment details" />;

  const spec = item.spec;
  const status = item.status;
  const failure = item.failure;

  const deleteOrder = spec?.deletion?.order ?? spec?.deletePolicy ?? 'Random (default)';

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
      value: renderReplicas(item) ?? '-',
      hide: !showReplicas(item),
    },
    {
      name: 'Strategy Type',
      value: renderUpdateStrategy(item),
      hide: !showUpdateStrategy(item),
    },

    {
      name: 'Delete Policy',
      value: deleteOrder,
    },
    {
      name: 'Min Ready Seconds',
      value: spec?.minReadySeconds ?? 0,
    },
    {
      name: 'Paused',
      value: renderConditionStatus(spec?.paused ? 'true' : 'false', undefined, {
        trueLabel: 'true',
        falseLabel: 'false',
        trueStatus: 'warning',
        falseStatus: 'success',
      }),
    },
    {
      name: 'Rollout After',
      value: spec?.rolloutAfter
        ? new Date(spec.rolloutAfter).toLocaleString()
        : 'default (immediate)',
    },
    {
      name: 'Selector',
      value: spec?.selector?.matchLabels ? (
        <MetadataDictGrid dict={spec.selector.matchLabels as Record<string, string>} />
      ) : (
        '-'
      ),
    },
    {
      name: 'Observed Generation',
      value:
        status?.observedGeneration !== undefined
          ? `${status.observedGeneration} / ${item.metadata?.generation ?? '-'}`
          : '-',
      hide: status?.observedGeneration === undefined,
    },
    {
      name: 'Version',
      value: spec?.template?.spec?.version ?? '-',
    },
    ...(failure?.failureReason
      ? [
          {
            name: 'Failure Reason',
            value: <StatusLabel status="error">{failure.failureReason}</StatusLabel>,
          },
        ]
      : []),
    ...(failure?.failureMessage
      ? [
          {
            name: 'Failure Message',
            value: <span style={{ color: 'var(--error-color)' }}>{failure.failureMessage}</span>,
          },
        ]
      : []),
  ];

  return (
    <DetailsGrid
      resourceType={VersionedMachineDeployment}
      withEvents
      name={crName}
      namespace={namespace ?? undefined}
      actions={item => (item ? [<ScaleButton item={item} />] : [])}
      extraInfo={() => extraInfo}
      extraSections={() => [
        {
          id: 'cluster-api.machine-deployment-machines',
          section: (
            <OwnedMachinesSection resource={item} hideColumns={['owner']} showCreateButton />
          ),
        },
        {
          id: 'cluster-api.machine-deployment-template',
          section: (
            <SectionBox title="Machine Template">
              <TemplateSection item={item} />
            </SectionBox>
          ),
        },
        {
          id: 'cluster-api.machine-deployment-conditions',
          section: (
            <ConditionsSection
              resource={{
                ...item.jsonData,
                status: {
                  ...item.jsonData.status,
                  conditions: item.conditions,
                },
              }}
            />
          ),
        },
      ]}
    />
  );
}

function MachineDeploymentDetailContent(props: MachineDeploymentDetailContentProps) {
  const { crdName } = props;
  const apiVersion = useCapiApiVersion(crdName, 'v1beta1');
  const VersionedMachineDeployment = useMemo(
    () => (apiVersion ? MachineDeployment.withApiVersion(apiVersion) : MachineDeployment),
    [apiVersion]
  );
  if (!apiVersion) return <Loader title="Detecting Cluster API version" />;
  return (
    <MachineDeploymentDetailContentWithData
      {...props}
      VersionedMachineDeployment={VersionedMachineDeployment}
      apiVersion={apiVersion}
    />
  );
}
