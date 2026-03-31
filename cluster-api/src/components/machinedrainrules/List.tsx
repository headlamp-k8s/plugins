import { Loader, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useMemo } from 'react';
import { MachineDrainRule } from '../../resources/machinedrainrule';
import { useCapiApiVersion } from '../../utils/capiVersion';

interface MachineDrainRulesListWithDataProps {
  MachineDrainRuleClass: typeof MachineDrainRule;
}

function MachineDrainRulesListWithData({
  MachineDrainRuleClass,
}: MachineDrainRulesListWithDataProps) {
  return (
    <ResourceListView
      title="Machine Drain Rules"
      resourceClass={MachineDrainRuleClass}
      columns={[
        'name',
        'namespace',
        {
          id: 'behavior',
          label: 'Behavior',
          getValue: mdr => mdr.spec.drain.behavior,
        },
        {
          id: 'order',
          label: 'Order',
          getValue: mdr => mdr.spec.drain.order,
        },
        'age',
      ]}
    />
  );
}

export function MachineDrainRulesList() {
  const version = useCapiApiVersion(MachineDrainRule.crdName, 'v1beta1');
  const VersionedMachineDrainRule = useMemo(
    () => (version ? MachineDrainRule.withApiVersion(version) : MachineDrainRule),
    [version]
  );
  if (!version) return <Loader title="Detecting MachineDrainRule version" />;
  return <MachineDrainRulesListWithData MachineDrainRuleClass={VersionedMachineDrainRule} />;
}
