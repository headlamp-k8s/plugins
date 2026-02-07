import {
  ConditionsSection,
  DetailsGrid,
  Link,
  MetadataDictGrid,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router';
import { Machine } from '../../resources/machine';

export function MachineDetail({ node }: { node: any }) {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  return (
    <>
      <DetailsGrid
        resourceType={Machine}
        withEvents
        name={name || node.kubeObject.metadata.name}
        namespace={namespace || node.kubeObject.metadata.namespace}
        extraInfo={item =>
          item && [
            {
              name: 'Cluster',
              value: item.spec?.clusterName && (
                <Link
                  routeName="capicluster"
                  params={{
                    name: item.spec.clusterName,
                    namespace: item.metadata.namespace,
                  }}
                >
                  {item.spec.clusterName}
                </Link>
              ),
            },
            {
              name: 'Phase',
              value: item.status?.phase,
            },
            {
              name: 'Version',
              value: item.spec?.version,
            },
            {
              name: 'Provider ID',
              value: item.spec?.providerID,
            },
            {
              name: 'Failure Domain',
              value: item.spec?.failureDomain,
            },
            {
              name: 'Bootstrap Ready',
              value: item.status?.bootstrapReady ? 'True' : 'False',
            },
            {
              name: 'Infrastructure Ready',
              value: item.status?.infrastructureReady ? 'True' : 'False',
            },
            {
              name: 'Node Name',
              value: item.status?.nodeRef?.name,
            },
            {
              name: 'Node Drain Timeout',
              value: item.spec?.nodeDrainTimeout,
              hide: item.spec?.nodeDrainTimeout === undefined,
            },
            {
              name: 'Node Volume Detach Timeout',
              value: item.spec?.nodeVolumeDetachTimeout,
              hide: item.spec?.nodeVolumeDetachTimeout === undefined,
            },
            {
              name: 'Node Deletion Timeout',
              value: item.spec?.nodeDeletionTimeout,
              hide: item.spec?.nodeDeletionTimeout === undefined,
            },
            {
              name: 'Certificate Expiry Date',
              value: item.status?.certificateExpiryDate
                ? new Date(item.status.certificateExpiryDate).toLocaleString()
                : undefined,
              hide: !item.status?.certificateExpiryDate,
            },
            {
              name: 'Addresses',
              value: item.status?.addresses && item.status.addresses.length > 0 && (
                <MetadataDictGrid
                  dict={Object.fromEntries(
                    item.status.addresses.map(
                      (addr: { type: string; address: string }) => [addr.type, addr.address]
                    )
                  )}
                />
              ),
              hide: !item.status?.addresses || item.status.addresses.length === 0,
            },
            {
              name: 'Infrastructure Ref',
              value: item.spec?.infrastructureRef?.kind
                ? `${item.spec.infrastructureRef.kind} / ${item.spec.infrastructureRef.name}`
                : undefined,
              hide: !item.spec?.infrastructureRef,
            },
            {
              name: 'Bootstrap Config Ref',
              value: item.spec?.bootstrap?.configRef?.kind
                ? `${item.spec.bootstrap.configRef.kind} / ${item.spec.bootstrap.configRef.name}`
                : undefined,
              hide: !item.spec?.bootstrap?.configRef,
            },
          ]
        }
        extraSections={item =>
          item && [
            {
              id: 'cluster-api.machine-conditions',
              section: <ConditionsSection resource={item?.jsonData} />,
            },
          ]
        }
      />
    </>
  );
}
