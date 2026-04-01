import {
  ConditionsSection,
  DetailsGrid,
  EmptyContent,
  Link,
  Loader,
  type NameValueTableRow,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { GraphNode } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { KubeadmControlPlaneTemplate } from '../../resources/kubeadmcontrolplanetemplate';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { KubeadmConfigSection } from '../common/index';

export function KubeadmControlPlaneTemplateDetail({ node }: { node?: GraphNode }) {
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();
  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;

  if (!crName) return <EmptyContent color="error">Missing resource name</EmptyContent>;

  return (
    <KubeadmControlPlaneTemplateDetailContent
      crName={crName}
      namespace={namespace}
      crdName={KubeadmControlPlaneTemplate.crdName}
    />
  );
}

function KubeadmControlPlaneTemplateDetailContent({
  crName,
  namespace,
  crdName,
}: {
  crName: string;
  namespace?: string;
  crdName: string;
}) {
  const apiVersion = useCapiApiVersion(crdName, 'v1beta1');
  const VersionedKCPT = useMemo(
    () =>
      apiVersion
        ? KubeadmControlPlaneTemplate.withApiVersion(apiVersion)
        : KubeadmControlPlaneTemplate,
    [apiVersion]
  );
  const [crd] = CustomResourceDefinition.useGet(crdName, undefined);
  const [item, itemError] = VersionedKCPT.useGet(crName, namespace ?? undefined);

  if (!apiVersion) return <Loader title="Detecting KCP Template version" />;

  if (itemError && !item) {
    return (
      <EmptyContent color="error">
        Error loading KubeadmControlPlaneTemplate {crName}: {itemError?.message}
      </EmptyContent>
    );
  }

  if (!item) return <Loader title="Loading KubeadmControlPlaneTemplate details" />;

  const templateSpec = item.spec?.template?.spec;
  const kubeadmConfigSpec = templateSpec?.kubeadmConfigSpec;

  const extraInfo: NameValueTableRow[] = [
    {
      name: 'Definition',
      value: (
        <Link routeName="crd" params={{ name: crdName }}>
          {crdName}
        </Link>
      ),
      hide: !crd,
    },
    {
      name: 'Rollout Strategy',
      value: templateSpec?.rolloutStrategy?.type ?? '-',
      hide: !templateSpec?.rolloutStrategy,
    },
    {
      name: 'Node Drain Timeout',
      value: templateSpec?.machineTemplate?.nodeDrainTimeout ?? '-',
      hide: !templateSpec?.machineTemplate?.nodeDrainTimeout,
    },
    {
      name: 'Node Volume Detach Timeout',
      value: templateSpec?.machineTemplate?.nodeVolumeDetachTimeout ?? '-',
      hide: !templateSpec?.machineTemplate?.nodeVolumeDetachTimeout,
    },
    {
      name: 'Node Deletion Timeout',
      value: templateSpec?.machineTemplate?.nodeDeletionTimeout ?? '-',
      hide: !templateSpec?.machineTemplate?.nodeDeletionTimeout,
    },
  ];

  return (
    <DetailsGrid
      resourceType={VersionedKCPT}
      withEvents
      name={crName}
      namespace={namespace ?? undefined}
      extraInfo={() => extraInfo}
      extraSections={() => [
        ...(kubeadmConfigSpec
          ? [
              {
                id: 'cluster-api.kcpt-kubeadm-config-spec',
                section: (
                  <KubeadmConfigSection
                    kubeadmConfigSpec={kubeadmConfigSpec}
                    title="KubeadmConfig Spec"
                  />
                ),
              },
            ]
          : []),
        {
          id: 'cluster-api.kcpt-conditions',
          section: <ConditionsSection resource={item.jsonData} />,
        },
      ]}
    />
  );
}
