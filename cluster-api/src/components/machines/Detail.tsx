import {
  ConditionsSection,
  DetailsGrid,
  EmptyContent,
  Link,
  Loader,
  NameValueTableRow,
  SectionBox,
  SimpleTable,
  StatusLabel,
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

function getMachineRole(machine: Machine): string {
  const owners = machine.metadata?.ownerReferences ?? [];
  return owners.some((ref: { kind?: string }) => ref.kind === 'KubeadmControlPlane')
    ? 'Control Plane'
    : 'Worker';
}
export function MachineDetail({ node }: { node?: MachineNode }) {
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();
  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;

  if (!crName) {
    return <EmptyContent color="error">Missing resource name</EmptyContent>;
  }

  return <MachineDetailContent crName={crName} namespace={namespace} crdName={Machine.crdName} />;
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
  const [item, itemError] = VersionedMachine.useGet(crName, namespace ?? undefined);

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

  const status = item.status;
  const extraInfo = (() => {
    const info: NameValueTableRow[] = [
      {
        name: 'Role',
        value: getMachineRole(item),
      },
      {
        name: 'Bootstrap Ready',
        value:
          status?.bootstrapReady !== undefined ? (
            <StatusLabel status={status.bootstrapReady ? 'success' : 'warning'}>
              {status.bootstrapReady ? 'True' : 'False'}
            </StatusLabel>
          ) : (
            '-'
          ),
      },
      {
        name: 'Infrastructure Ready',
        value:
          status?.infrastructureReady !== undefined ? (
            <StatusLabel status={status.infrastructureReady ? 'success' : 'warning'}>
              {status.infrastructureReady ? 'True' : 'False'}
            </StatusLabel>
          ) : (
            '-'
          ),
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
      info.push(
        ...getExtraInfoFromPrinterColumns(getExtraColumnsFromCrd(crd, apiVersion), item.jsonData)
      );
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
      namespace={namespace ?? undefined}
      extraInfo={extraInfo}
      extraSections={() => [
        ...(status?.addresses?.length
          ? [
              {
                id: 'cluster-api.machine-addresses',
                section: (
                  <SectionBox title="Addresses">
                    <SimpleTable
                      columns={[
                        {
                          label: 'Type',
                          getter: (row: { type: string; address: string }) => row.type,
                        },
                        {
                          label: 'Address',
                          getter: (row: { type: string; address: string }) => row.address,
                        },
                      ]}
                      data={status.addresses}
                    />
                  </SectionBox>
                ),
              },
            ]
          : []),

        ...(status?.nodeInfo
          ? [
              {
                id: 'cluster-api.machine-node-info',
                section: (
                  <SectionBox title="Node Info">
                    <SimpleTable
                      columns={[
                        {
                          label: 'Field',
                          getter: (row: { field: string; value: string }) => row.field,
                        },
                        {
                          label: 'Value',
                          getter: (row: { field: string; value: string }) => row.value,
                        },
                      ]}
                      data={[
                        { field: 'OS Image', value: status.nodeInfo.osImage },
                        { field: 'Operating System', value: status.nodeInfo.operatingSystem },
                        { field: 'Architecture', value: status.nodeInfo.architecture },
                        { field: 'Kernel Version', value: status.nodeInfo.kernelVersion },
                        {
                          field: 'Container Runtime',
                          value: status.nodeInfo.containerRuntimeVersion,
                        },
                        { field: 'Kubelet Version', value: status.nodeInfo.kubeletVersion },
                        { field: 'Kube Proxy Version', value: status.nodeInfo.kubeProxyVersion },
                        { field: 'Machine ID', value: status.nodeInfo.machineID },
                        { field: 'System UUID', value: status.nodeInfo.systemUUID },
                        { field: 'Boot ID', value: status.nodeInfo.bootID },
                        ...(status.nodeInfo.swap?.capacity !== undefined
                          ? [
                              {
                                field: 'Swap Capacity',
                                value: String(status.nodeInfo.swap.capacity),
                              },
                            ]
                          : []),
                      ]}
                    />
                  </SectionBox>
                ),
              },
            ]
          : []),

        {
          id: 'cluster-api.machine-conditions',
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

function MachineDetailContent(props: MachineDetailContentProps) {
  const { crdName } = props;
  const apiVersion = useCapiApiVersion(crdName, 'v1beta1');
  const VersionedMachine = useMemo(
    () => (apiVersion ? Machine.withApiVersion(apiVersion) : Machine),
    [apiVersion]
  );

  if (!apiVersion) {
    return <Loader title="Detecting Cluster API version" />;
  }

  return (
    <MachineDetailContentWithData
      {...props}
      VersionedMachine={VersionedMachine}
      apiVersion={apiVersion}
    />
  );
}
