// One shared watch set feeding both the embedded live graph and the
// sub-resources table, so they can never disagree.
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import {
  SubResourceCollectors,
  useCollectedSubResources,
} from '../components/instances/subResourceCollectors';
import SubResourcesSection from '../components/instances/SubResourcesSection';
import { KroInstance } from '../resources/instance';
import { ResourceGraphDefinition } from '../resources/resourceGraphDefinition';
import InstanceGraphSection from './InstanceGraphSection';

export default function LiveInstanceSections(props: {
  rgd: ResourceGraphDefinition;
  instance: KubeObject<KroInstance>;
}) {
  const { rgd, instance } = props;
  const { items, errors, onItems } = useCollectedSubResources();

  return (
    <>
      <SubResourceCollectors rgd={rgd} instance={instance} onItems={onItems} />
      <InstanceGraphSection rgd={rgd} instance={instance} items={items} />
      <SubResourcesSection
        rgd={rgd}
        instance={instance}
        itemsOverride={items}
        errorsOverride={errors}
      />
    </>
  );
}
