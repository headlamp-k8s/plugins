import { ConditionsSection, DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router';
import { KubeadmControlPlane } from '../../resources/kubeadmcontrolplane';
import { formatKCPRolloutStrategy } from '../../utils';
import { renderReplicas, showReplicas } from '../common';

export function KubeadmControlPlaneDetail({ node }: { node: any }) {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();

  return (
    <>
      <DetailsGrid
        resourceType={KubeadmControlPlane}
        withEvents
        name={name || node.kubeObject.metadata.name}
        namespace={namespace || node.kubeObject.metadata.namespace}
        extraInfo={item =>
          item && [
            {
              name: 'Version',
              value: item.spec?.version,
            },
            {
              name: 'Initialized',
              value: item.status?.initialized ? 'True' : 'False',
            },
            {
              name: 'Ready',
              value: item.status?.ready ? 'True' : 'False',
            },
            {
              name: 'Replicas',
              value: renderReplicas(item),
              hide: !showReplicas(item),
            },
            {
              name: 'Rollout Strategy',
              value: formatKCPRolloutStrategy(item.spec?.rolloutStrategy),
              hide: !item.spec?.rolloutStrategy,
            },
            {
              name: 'Rollout After',
              value: item.spec?.rolloutAfter
                ? new Date(item.spec.rolloutAfter).toLocaleString()
                : undefined,
              hide: !item.spec?.rolloutAfter,
            },
            {
              name: 'Certificate Expiry Days (Rollout Before)',
              value: item.spec?.rolloutBefore?.certificateExpiryDays,
              hide: !item.spec?.rolloutBefore?.certificateExpiryDays,
            },
            {
              name: 'Infrastructure Ref',
              value: item.spec?.machineTemplate?.infrastructureRef?.kind
                ? `${item.spec.machineTemplate.infrastructureRef.kind} / ${item.spec.machineTemplate.infrastructureRef.name}`
                : undefined,
              hide: !item.spec?.machineTemplate?.infrastructureRef,
            },
            {
              name: 'Remediation Max Retry',
              value: item.spec?.remediationStrategy?.maxRetry,
              hide: !item.spec?.remediationStrategy,
            },
            {
              name: 'Last Remediation Machine',
              value: item.status?.lastRemediationStatus?.machine,
              hide: !item.status?.lastRemediationStatus,
            },
            {
              name: 'Last Remediation Retry Count',
              value: item.status?.lastRemediationStatus?.retryCount,
              hide: !item.status?.lastRemediationStatus,
            },
          ]
        }
        extraSections={item =>
          item && [
            {
              id: 'cluster-api.kubeadm-control-plane-conditions',
              section: <ConditionsSection resource={item?.jsonData} />,
            },
          ]
        }
      />
    </>
  );
}
