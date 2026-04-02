import {
  ConditionsSection,
  DetailsGrid,
  Loader,
  MetadataDictGrid,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { MachineHealthCheck } from '../../resources/machinehealthcheck';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { HealthCheckSection } from '../common';

interface MachineHealthCheckNode {
  kubeObject: MachineHealthCheck;
}

/**
 * Main detail view for a MachineHealthCheck resource.
 * @see https://cluster-api.sigs.k8s.io/tasks/healthcheck.html
 *
 * @param props - Component properties including optional node from a list.
 */
export function MachineHealthCheckDetail({ node }: { node?: MachineHealthCheckNode }) {
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();

  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;

  if (!crName) return null; // Or handle error

  const apiVersion = useCapiApiVersion(MachineHealthCheck.crdName, 'v1beta1');
  const VersionedMachineHealthCheck = useMemo(
    () => (apiVersion ? MachineHealthCheck.withApiVersion(apiVersion) : MachineHealthCheck),
    [apiVersion]
  );

  if (!apiVersion) return <Loader title="Detecting MachineHealthCheck version" />;

  return (
    <>
      <DetailsGrid
        resourceType={VersionedMachineHealthCheck}
        withEvents
        name={crName}
        namespace={namespace}
        extraInfo={item => {
          return [
            {
              name: 'Cluster Name',
              value: item.spec?.clusterName,
            },
            {
              name: 'Node Startup Timeout',
              value: item.spec?.checks?.nodeStartupTimeoutSeconds
                ? `${item.spec.checks.nodeStartupTimeoutSeconds}s`
                : item.spec?.nodeStartupTimeout
                ? `${item.spec.nodeStartupTimeout}`
                : 'Not set',
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
              value: item.status?.targets?.join(', '),
            },
            {
              name: 'Remediations Allowed',
              value: item.status?.remediationsAllowed,
            },
            {
              name: 'Remediation Template',
              value: item.spec?.remediationTemplate?.metadata?.name,
            },
            {
              name: 'Observed Generation',
              value:
                item.status?.observedGeneration !== undefined
                  ? `${item.status.observedGeneration} / ${item.metadata?.generation ?? '-'}`
                  : '-',
              hide: item.status?.observedGeneration === undefined,
            },
          ];
        }}
        extraSections={item =>
          item && [
            {
              id: 'cluster-api.machine-health-check-health',
              section: (
                <HealthCheckSection
                  machineHealthCheck={item.spec}
                  title="Health Check Configuration"
                />
              ),
            },
            {
              id: 'cluster-api.machine-health-check-conditions',
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
          ]
        }
      />
    </>
  );
}
