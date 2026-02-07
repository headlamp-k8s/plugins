import { ConditionsSection, DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router';
import { ClusterClass } from '../../resources/clusterclass';

export function ClusterClassDetail({ node }: { node: any }) {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  return (
    <>
      <DetailsGrid
        resourceType={ClusterClass}
        withEvents
        name={name || node.kubeObject.metadata.name}
        namespace={namespace || node.kubeObject.metadata.namespace}
        extraInfo={item =>
          item && [
            {
              name: 'Infrastructure Ref',
              value: item.spec?.infrastructure?.ref
                ? `${item.spec.infrastructure.ref.kind} / ${item.spec.infrastructure.ref.name}`
                : undefined,
              hide: !item.spec?.infrastructure?.ref,
            },
            {
              name: 'Control Plane Kind',
              value: item.spec?.controlPlane?.kind,
              hide: !item.spec?.controlPlane,
            },
            {
              name: 'Control Plane Machine Infrastructure',
              value: item.spec?.controlPlane?.machineInfrastructure?.kind
                ? `${item.spec.controlPlane.machineInfrastructure.kind}`
                : undefined,
              hide: !item.spec?.controlPlane?.machineInfrastructure,
            },
            {
              name: 'Machine Deployment Classes',
              value: item.spec?.workers?.machineDeployments
                ?.map(md => md.class)
                .join(', '),
              hide:
                !item.spec?.workers?.machineDeployments ||
                item.spec.workers.machineDeployments.length === 0,
            },
            {
              name: 'Machine Pool Classes',
              value: item.spec?.workers?.machinePools
                ?.map(mp => mp.class)
                .join(', '),
              hide:
                !item.spec?.workers?.machinePools ||
                item.spec.workers.machinePools.length === 0,
            },
            {
              name: 'Variables',
              value: item.spec?.variables
                ?.map(v => `${v.name}${v.required ? ' (required)' : ''}`)
                .join(', '),
              hide: !item.spec?.variables || item.spec.variables.length === 0,
            },
            {
              name: 'Patches',
              value: item.spec?.patches?.map(p => p.name).join(', '),
              hide: !item.spec?.patches || item.spec.patches.length === 0,
            },
          ]
        }
        extraSections={item =>
          item && [
            {
              id: 'cluster-api.cluster-class-conditions',
              section: <ConditionsSection resource={item?.jsonData} />,
            },
          ]
        }
      />
    </>
  );
}
