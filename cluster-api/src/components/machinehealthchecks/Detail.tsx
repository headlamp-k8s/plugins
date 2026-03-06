import {
  ConditionsSection,
  DetailsGrid,
  MetadataDictGrid,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router';
import { MachineHealthCheck } from '../../resources/machinehealthcheck';

export function MachineHealthCheckDetail({ node }: { node: any }) {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  return (
    <>
      <DetailsGrid
        resourceType={MachineHealthCheck}
        withEvents
        name={name || node.kubeObject.metadata.name}
        namespace={namespace || node.kubeObject.metadata.namespace}
        extraInfo={item =>
          item && [
            {
              name: 'Cluster Name',
              value: item.spec?.clusterName,
            },
            {
              name: 'Node Startup Timeout',
              value: item.spec?.nodeStartupTimeout,
            },
            {
              name: 'Expected Machines',
              value: item.status?.expectedMachines,
            },
            {
              name: 'Current Healthy',
              value: item.status?.currentHealthy,
            },
            {
              name: 'Selector',
              value: item.spec?.selector && (
                <MetadataDictGrid
                  dict={item.spec?.selector.matchLabels as Record<string, string>}
                />
              ),
            },
            {
              name: 'Targets',
              value: item.status.targets.join(', '),
            },
            {
              name: 'Remediations Allowed',
              value: item.status?.remediationsAllowed,
            },
            {
              name: 'Remediation Template',
              value: item.spec?.remediationTemplate?.metadata?.name,
            },
          ]
        }
        extraSections={item =>
          item && [
            {
              id: 'cluster-api.machine-health-check-conditions',
              section: <ConditionsSection resource={item?.jsonData} />,
            },
          ]
        }
      />
    </>
  );
}
