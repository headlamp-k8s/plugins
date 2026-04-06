import { DetailsGrid, Loader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { MachineDrainRule } from '../../resources/machinedrainrule';
import { useCapiApiVersion } from '../../utils/capiVersion';

interface MachineDrainRuleNode {
  kubeObject: MachineDrainRule;
}

/**
 * Main detail view for a MachineDrainRule resource.
 * @see https://cluster-api.sigs.k8s.io/tasks/experimental-features/managed-drain.html
 *
 * @param props - Component properties including optional node from a list.
 */
export function MachineDrainRuleDetail({ node }: { node?: MachineDrainRuleNode }) {
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();

  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;

  if (!crName) return null;

  const apiVersion = useCapiApiVersion(MachineDrainRule.crdName, 'v1beta1');

  const VersionedMachineDrainRule = useMemo(
    () => (apiVersion ? MachineDrainRule.withApiVersion(apiVersion) : MachineDrainRule),
    [apiVersion]
  );

  if (!apiVersion) return <Loader title="Detecting MachineDrainRule version" />;

  return (
    <>
      <DetailsGrid
        resourceType={VersionedMachineDrainRule}
        withEvents
        name={crName}
        namespace={namespace}
      />
    </>
  );
}
