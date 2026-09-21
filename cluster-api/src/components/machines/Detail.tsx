import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  ConditionsSection,
  DetailsGrid,
  EmptyContent,
  Link,
  Loader,
  NameValueTableRow,
  SectionBox,
  SimpleTable,
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
import { TemplateSection } from '../common';
import { getMachineActions } from './Actions';

type MachineNode = {
  kubeObject: Machine;
};

/**
 * Helper to determine the role of a machine (Control Plane vs Worker) based on its owners.
 *
 * @param machine - The machine object to evaluate.
 * @returns The role string ('Control Plane' or 'Worker').
 */
function getMachineRole(machine: Machine, t: (key: string) => string): string {
  const owners = machine.metadata?.ownerReferences ?? [];
  return owners.some((ref: { kind?: string }) => ref.kind === 'KubeadmControlPlane')
    ? t('Control Plane')
    : t('Worker');
}

/**
 * Main detail view component for the Machine resource.
 * Handles both URL-params and direct node passing (Internal Headlamp navigation).
 *
 * @param props - Component properties.
 * @param props.node - Optional node object containing already fetched machine data.
 */
export function MachineDetail({ node }: { node?: MachineNode }) {
  const { t } = useTranslation();
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();
  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;

  if (!crName) {
    return <EmptyContent color="error">{t('Missing resource name')}</EmptyContent>;
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

/**
 * Renders the final Machine detail view with all fetched data.
 *
 * @param props - Component properties including the versioned class and detected version.
 */
function MachineDetailContentWithData(props: MachineDetailContentPropsWithVersion) {
  const { t } = useTranslation();
  const { crName, namespace, crdName, VersionedMachine, apiVersion } = props;
  const [crd, crdError] = CustomResourceDefinition.useGet(crdName, undefined);
  const [item, itemError] = VersionedMachine.useGet(crName, namespace ?? undefined);

  if (itemError && !item) {
    return (
      <EmptyContent color="error">
        {t('Error loading Machine {{name}}: {{message}}', {
          name: crName,
          message: itemError?.message,
        })}
      </EmptyContent>
    );
  }

  if (!item) {
    return <Loader title={t('Loading Machine details')} />;
  }
  const extraInfo = (() => {
    const info: NameValueTableRow[] = [
      {
        name: t('Role'),
        value: getMachineRole(item, t),
      },
    ];
    if (crd) {
      info.unshift({
        name: t('Definition'),
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
        name: t('Additional info'),
        value: t('Some extra details could not be loaded.'),
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
      actions={machine => (machine ? getMachineActions(machine) : [])}
      extraInfo={extraInfo}
      extraSections={machine => {
        const machineStatus = machine?.status;
        return [
          {
            id: 'cluster-api.machine-template',
            section: (
              <SectionBox title={t('Machine Template')}>
                <TemplateSection item={machine} />
              </SectionBox>
            ),
          },
          {
            id: 'cluster-api.machine-conditions',
            section: (
              <ConditionsSection
                resource={{
                  ...machine.jsonData,
                  status: {
                    ...machine.jsonData.status,
                    conditions: machine.conditions,
                  },
                }}
              />
            ),
          },
          ...(machineStatus?.addresses?.length
            ? [
                {
                  id: 'cluster-api.machine-addresses',
                  section: (
                    <SectionBox title={t('Addresses')}>
                      <SimpleTable
                        columns={[
                          {
                            label: t('Type'),
                            getter: (row: { type: string; address: string }) => row.type,
                          },
                          {
                            label: t('Address'),
                            getter: (row: { type: string; address: string }) => row.address,
                          },
                        ]}
                        data={machineStatus.addresses}
                      />
                    </SectionBox>
                  ),
                },
              ]
            : []),

          ...(machineStatus?.nodeInfo
            ? [
                {
                  id: 'cluster-api.machine-node-info',
                  section: (
                    <SectionBox title={t('Node Info')}>
                      <SimpleTable
                        columns={[
                          {
                            label: t('Field'),
                            getter: (row: { field: string; value: string }) => row.field,
                          },
                          {
                            label: t('Value'),
                            getter: (row: { field: string; value: string }) => row.value,
                          },
                        ]}
                        data={[
                          { field: t('OS Image'), value: machineStatus.nodeInfo.osImage },
                          {
                            field: t('Operating System'),
                            value: machineStatus.nodeInfo.operatingSystem,
                          },
                          { field: t('Architecture'), value: machineStatus.nodeInfo.architecture },
                          {
                            field: t('Kernel Version'),
                            value: machineStatus.nodeInfo.kernelVersion,
                          },
                          {
                            field: t('Container Runtime'),
                            value: machineStatus.nodeInfo.containerRuntimeVersion,
                          },
                          {
                            field: t('Kubelet Version'),
                            value: machineStatus.nodeInfo.kubeletVersion,
                          },
                          {
                            field: t('Kube Proxy Version'),
                            value: machineStatus.nodeInfo.kubeProxyVersion,
                          },
                          { field: t('Machine ID'), value: machineStatus.nodeInfo.machineID },
                          { field: t('System UUID'), value: machineStatus.nodeInfo.systemUUID },
                          { field: t('Boot ID'), value: machineStatus.nodeInfo.bootID },
                          ...(machineStatus.nodeInfo.swap?.capacity !== undefined
                            ? [
                                {
                                  field: t('Swap Capacity'),
                                  value: String(machineStatus.nodeInfo.swap.capacity),
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
        ];
      }}
    />
  );
}

/**
 * Data-fetching wrapper that detects the correct CAPI version for the resource.
 *
 * @param props - Component identification props.
 */
function MachineDetailContent(props: MachineDetailContentProps) {
  const { t } = useTranslation();
  const { crdName } = props;
  const apiVersion = useCapiApiVersion(crdName, 'v1beta1');
  const VersionedMachine = useMemo(
    () => (apiVersion ? Machine.withApiVersion(apiVersion) : Machine),
    [apiVersion]
  );

  if (!apiVersion) {
    return <Loader title={t('Detecting Cluster API version')} />;
  }
  return (
    <MachineDetailContentWithData
      {...props}
      VersionedMachine={VersionedMachine}
      apiVersion={apiVersion}
    />
  );
}
