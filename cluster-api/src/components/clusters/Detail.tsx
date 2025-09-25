import {
  ConditionsSection,
  DetailsGrid,
  Link,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router';
import { Cluster } from '../../resources/cluster';
import { GetKubeconfigAction } from '../actions';

export function ClusterDetail({ node }: { node: any }) {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  return (
    <>
      <DetailsGrid
        resourceType={Cluster}
        withEvents
        name={name || node.kubeObject.metadata.name}
        namespace={namespace || node.kubeObject.metadata.namespace}
        actions={item => [
          item && {
            id: 'cluster-api.get-kubeconfig',
            action: GetKubeconfigAction({ resource: item }),
            label: 'Download Kubeconfig',
            description: 'Download Kubeconfig',
            longDescription: 'Download the Kubeconfig file for this cluster',
            icon: 'mdi:cloud-download',
          },
        ]}
        extraInfo={item =>
          item && [
            {
              name: 'Control Plane Ready',
              value: item.status?.controlPlaneReady ? 'true' : 'false',
            },
            {
              name: 'Infrastructure Ready',
              value: item.status?.infrastructureReady ? 'true' : 'false',
            },
            {
              name: 'Paused',
              value: item.spec?.paused ? 'true' : 'false',
            },
            {
              name: 'API Server Port',
              value: item.spec?.clusterNetwork?.apiServerPort || 'default (6443)',
            },
            {
              name: 'Pod CIDR Blocks',
              value: item.spec?.clusterNetwork?.pods?.cidrBlocks.join(', '),
            },
            {
              name: 'Service CIDR Blocks',
              value: item.spec?.clusterNetwork?.services?.cidrBlocks.join(', '),
            },
            {
              name: 'Service Domain',
              value: item.spec?.clusterNetwork?.serviceDomain || 'default (cluster.local)',
            },
            {
              name: 'Control Plane Endpoint',
              value:
                item.spec?.controlPlaneEndpoint?.host + ':' + item.spec?.controlPlaneEndpoint?.port,
            },
            {
              name: 'Cluster Class',
              value: item.spec?.topology?.class && (
                <Link
                  routeName={'clusterclass'}
                  params={{ name: item.spec?.topology?.class, namespace: item.metadata.namespace }}
                >
                  {item.spec?.topology?.class}
                </Link>
              ),
            },
            {
              name: 'Version',
              value: item.spec?.topology?.version,
            },
            {
              name: 'Control Plane Replicas',
              value: item.spec?.topology?.controlPlane?.replicas,
            },
            {
              name: 'Worker Count',
              // Add up the replicas of all worker machinepools and machine deployments
              value:
                (item.spec?.topology?.workers?.machinePools?.reduce(
                  (acc, ms) => acc + (ms.replicas || 0),
                  0
                ) ?? 0) +
                (item.spec?.topology?.workers?.machineDeployments?.reduce(
                  (acc, md) => acc + (md.replicas || 0),
                  0
                ) ?? 0),
            },
          ]
        }
        extraSections={item =>
          item && [
            {
              id: 'cluster-api.cluster-conditions',
              section: <ConditionsSection resource={item?.jsonData} />,
            },
          ]
        }
      />
    </>
  );
}
