import {
  ConditionsSection,
  DetailsGrid,
  EmptyContent,
  Link,
  Loader,
  NameValueTableRow,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { Machine } from '../../resources/machine';
import { useCapiApiVersion } from '../../utils/capiVersion';
import {
  getExtraColumnsFromCrd,
  getExtraInfoFromPrinterColumns,
} from '../../utils/crdPrinterColumns';

type MachineNode = {
  kubeObject: Machine;
};

function getMachineRole(data: Machine) {
  const owners = data?.metadata?.ownerReferences ?? [];
  const isControlPlane = owners.some(
    (ref: { kind?: string }) => ref.kind === 'KubeadmControlPlane'
  );
  return isControlPlane ? 'Control Plane' : 'Worker';
}

export function MachineDetail({ node }: { node?: MachineNode }) {
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();
  const crdName = Machine.crdName;
  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;

  if (!crName) {
    return <EmptyContent color="error">Missing resource name</EmptyContent>;
  }

  return <MachineDetailContent crName={crName} namespace={namespace} crdName={crdName} />;
}

interface MachineDetailContentProps {
  crName: string;
  namespace?: string;
  crdName: string;
}

interface MachineDetailContentPropsWithVersion extends MachineDetailContentProps {
  VersionedMachine: typeof Machine;
  apiVersion: string;
}

function MachineDetailContentWithData({
  crName,
  namespace,
  crdName,
  VersionedMachine,
  apiVersion,
}: MachineDetailContentPropsWithVersion) {
  const [crd, crdError] = CustomResourceDefinition.useGet(crdName, undefined);
  const [item, itemError] = VersionedMachine.useGet(crName, namespace || undefined);

  if (itemError && !item) {
    return (
      <EmptyContent color="error">
        Error loading Machine {crName}: {itemError?.message}
      </EmptyContent>
    );
  }

  if (!item) {
    return <Loader title="Loading Machine details" />;
  }

  const data = item.jsonData as Record<string, unknown>;

  const extraInfo = (() => {
    const info: NameValueTableRow[] = [
      {
        name: 'Role',
        value: getMachineRole(item),
      },
    ];
    if (crd) {
      info.unshift({
        name: 'Definition',
        value: (
          <Link routeName="crd" params={{ name: crdName }}>
            {crdName}
          </Link>
        ),
      });
      info.push(...getExtraInfoFromPrinterColumns(getExtraColumnsFromCrd(crd, apiVersion), data));
    } else if (crdError) {
      info.push({
        name: 'Additional info',
        value: 'Some extra details could not be loaded.',
      });
    }
    return info;
  })();

  return (
    <DetailsGrid
      resourceType={VersionedMachine}
      withEvents
      name={crName}
      namespace={namespace || undefined}
      extraInfo={extraInfo}
      extraSections={() => [
        {
          id: 'cluster-api.machine-conditions',
          section: (
            <ConditionsSection
              resource={
                item.status
                  ? { ...item.jsonData, status: { ...item.jsonData?.status, ...item.status } }
                  : item.jsonData
              }
            />
          ),
        },
      ]}
    />
  );
}

function MachineDetailContent(props: MachineDetailContentProps) {
  const { crdName } = props;
  const apiVersion = useCapiApiVersion(crdName, 'v1beta1');
  if (!apiVersion) {
    return <Loader title="Detecting Cluster API version" />;
  }
  const VersionedMachine = useMemo(() => Machine.withApiVersion(apiVersion), [apiVersion]);
  return (
    <MachineDetailContentWithData
      {...props}
      VersionedMachine={VersionedMachine}
      apiVersion={apiVersion}
    />
  );
}
