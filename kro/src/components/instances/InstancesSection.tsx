import {
  DateLabel,
  EmptyContent,
  Link,
  Loader,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { InstanceClass, KroInstance, useInstanceClass } from '../../resources/instance';
import { ResourceGraphDefinition } from '../../resources/resourceGraphDefinition';
import { kroRouteNames } from '../../utils/kroRoutes';
import { KroStateLabel } from '../resourcegraphdefinitions/common';

function InstancesTable(props: { instanceClass: InstanceClass; rgdName: string }) {
  const { instanceClass, rgdName } = props;
  const [instances, error] = instanceClass.useList();

  if (error) {
    return (
      <EmptyContent>
        Unable to list {instanceClass.kind} instances: {error.message}
      </EmptyContent>
    );
  }
  if (instances === null) {
    return <Loader title={`Loading ${instanceClass.kind} instances`} />;
  }
  if (instances.length === 0) {
    return <EmptyContent>No {instanceClass.kind} instances exist yet.</EmptyContent>;
  }

  return (
    <SimpleTable
      columns={[
        {
          label: 'Name',
          getter: (instance: KubeObject<KroInstance>) =>
            instance.metadata.namespace ? (
              <Link
                routeName={kroRouteNames.instanceDetail}
                params={{
                  rgdName,
                  namespace: instance.metadata.namespace,
                  name: instance.metadata.name,
                }}
              >
                {instance.metadata.name}
              </Link>
            ) : (
              <Link
                routeName={kroRouteNames.clusterInstanceDetail}
                params={{ rgdName, name: instance.metadata.name }}
              >
                {instance.metadata.name}
              </Link>
            ),
        },
        {
          label: 'Namespace',
          getter: (instance: KubeObject<KroInstance>) => instance.metadata.namespace ?? '-',
        },
        {
          label: 'State',
          getter: (instance: KubeObject<KroInstance>) => (
            <KroStateLabel state={instance.jsonData.status?.state} />
          ),
        },
        {
          label: 'Ready',
          getter: (instance: KubeObject<KroInstance>) => {
            const ready = instance.jsonData.status?.conditions?.find(
              condition => condition.type === 'Ready'
            );
            return ready?.status ?? '-';
          },
        },
        {
          label: 'Age',
          getter: (instance: KubeObject<KroInstance>) => (
            <DateLabel date={instance.metadata.creationTimestamp} format="mini" />
          ),
        },
      ]}
      data={instances}
    />
  );
}

/**
 * Lists the instances of an RGD's generated API. Renders inside the RGD
 * detail page and degrades (rather than crashing) when the RGD is
 * Inactive, the CRD is missing, or CRDs cannot be listed.
 */
export default function InstancesSection(props: { rgd: ResourceGraphDefinition }) {
  const { rgd } = props;
  const { instanceClass, error, isLoading } = useInstanceClass(rgd);

  return (
    <SectionBox title={`Instances${instanceClass ? ` (${instanceClass.kind})` : ''}`}>
      {isLoading ? (
        <Loader title="Discovering generated CRD" />
      ) : error ? (
        <EmptyContent>Unable to discover the generated CRD: {error.message}</EmptyContent>
      ) : !instanceClass ? (
        <EmptyContent>
          The generated CRD for {rgd.generatedKind} was not found. The RGD may be Inactive.
        </EmptyContent>
      ) : (
        <InstancesTable instanceClass={instanceClass} rgdName={rgd.getName()} />
      )}
    </SectionBox>
  );
}
