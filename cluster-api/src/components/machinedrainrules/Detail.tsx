import { DetailsGrid, Loader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { MachineDrainRule } from '../../resources/machinedrainrule';
import { useCapiApiVersion } from '../../utils/capiVersion';

export function MachineDrainRuleDetail({ node }: { node: any }) {
  const { name, namespace } = useParams<{ name: string; namespace: string }>();
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
        name={name || node?.kubeObject?.metadata?.name}
        namespace={namespace || node?.kubeObject?.metadata?.namespace}
      />
    </>
  );
}
