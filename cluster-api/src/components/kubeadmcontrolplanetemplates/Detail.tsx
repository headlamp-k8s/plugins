import {
  ConditionsSection,
  DetailsGrid,
  EmptyContent,
  Link,
  Loader,
  type NameValueTableRow,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { KubeadmControlPlaneTemplate } from '../../resources/kubeadmcontrolplanetemplate';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { KubeadmConfigSection } from '../common/index';

/**
 * Main detail view for a KubeadmControlPlaneTemplate resource.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#control-plane-template
 *
 * @param props - Component properties including optional node from a list.
 */
/**
 * Props for KubeadmControlPlaneTemplateDetail.
 * Use a generic node prop interface for consistency with other detail pages.
 */
interface KCPTemplateNode {
  kubeObject: KubeadmControlPlaneTemplate;
}

/**
 * Main detail view for a KubeadmControlPlaneTemplate resource.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#control-plane-template
 *
 * @param props - Component properties including optional node from a list.
 */
export function KubeadmControlPlaneTemplateDetail({ node }: { node?: KCPTemplateNode }) {
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

/**
 * Props for the KubeadmControlPlaneTemplateDetailContent wrapper.
 */
interface KCPTemplateDetailContentProps {
  /** The resource name from the URL params */
  crName: string;
  /** The namespace from the URL params */
  namespace?: string;
  /** The fully qualified CRD name */
  crdName: string;
}

/**
 * Props for the versioned KubeadmControlPlaneTemplate detail view.
 */
interface KCPTemplateDetailWithVersionProps extends KCPTemplateDetailContentProps {
  /** The resource class bound to the detected API version */
  VersionedKCPT: typeof KubeadmControlPlaneTemplate;
  /** The detected CAPI API version (e.g., v1beta1, v1beta2) */
  apiVersion: string;
}

function KCPTemplateDetailWithData(props: KCPTemplateDetailWithVersionProps) {
  const { crName, namespace, VersionedKCPT, crdName } = props;
  const [crd] = CustomResourceDefinition.useGet(crdName, undefined);
  const [item, itemError] = VersionedKCPT.useGet(crName, namespace ?? undefined);
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

function KubeadmControlPlaneTemplateDetailContent(props: KCPTemplateDetailContentProps) {
  const { crdName } = props;
  const apiVersion = useCapiApiVersion(crdName, 'v1beta1');
  const VersionedKCPT = useMemo(
    () =>
      apiVersion
        ? KubeadmControlPlaneTemplate.withApiVersion(apiVersion)
        : KubeadmControlPlaneTemplate,
    [apiVersion]
  );
  if (!apiVersion) return <Loader title="Detecting Cluster API version" />;
  return (
    <KCPTemplateDetailWithData {...props} VersionedKCPT={VersionedKCPT} apiVersion={apiVersion} />
  );
}
