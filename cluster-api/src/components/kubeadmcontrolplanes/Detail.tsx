import {
  ConditionsSection,
  DetailsGrid,
  EmptyContent,
  Link,
  Loader,
  type NameValueTableRow,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { SimpleTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { localeDate } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Typography } from '@mui/material';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { getKCPInitialized, KubeadmControlPlane } from '../../resources/kubeadmcontrolplane';
import { useCapiApiVersion } from '../../utils/capiVersion';
import {
  KubeadmConfigSection,
  OwnedMachinesSection,
  renderReplicas,
  renderUpdateStrategy,
  showReplicas,
  showUpdateStrategy,
  TemplateSection,
} from '../common/index';

/**
 * Props for the KubeadmControlPlaneDetail component.
 * @see https://cluster-api.sigs.k8s.io/tasks/kubeadm-control-plane/
 */
interface KubeadmControlPlaneDetailProps {
  /** The Headlamp node object containing the KubeadmControlPlane resource */
  node?: {
    /** The actual KubeadmControlPlane resource object */
    kubeObject: KubeadmControlPlane;
  };
}

/**
 * Main detail view component for the KubeadmControlPlane resource.
 */
export function KubeadmControlPlaneDetail({ node }: KubeadmControlPlaneDetailProps) {
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();
  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;

  if (!crName) return <EmptyContent color="error">Missing resource name</EmptyContent>;

  return (
    <KubeadmControlPlaneDetailContent
      crName={crName}
      namespace={namespace}
      crdName={KubeadmControlPlane.crdName}
    />
  );
}

/**
 * Props for the KubeadmControlPlaneDetailContent wrapper.
 */
interface KubeadmControlPlaneDetailContentProps {
  /** The resource name from the URL params */
  crName: string;
  /** The namespace from the URL params */
  namespace?: string;
  /** The fully qualified CRD name */
  crdName: string;
}

/**
 * Wrapper component to detect CAPI API version for a KubeadmControlPlane.
 *
 * @param props - Component properties.
 */
function KubeadmControlPlaneDetailContent(props: KubeadmControlPlaneDetailContentProps) {
  const { crName, namespace, crdName } = props;
  const apiVersion = useCapiApiVersion(crdName, 'v1beta1');
  const VersionedKubeadmControlPlane = useMemo(
    () => (apiVersion ? KubeadmControlPlane.withApiVersion(apiVersion) : KubeadmControlPlane),
    [apiVersion]
  );
  if (!apiVersion) return <Loader title="Detecting Cluster API version" />;

  return (
    <KubeadmControlPlaneDetailWithData
      crName={crName}
      namespace={namespace}
      crdName={crdName}
      VersionedKCP={VersionedKubeadmControlPlane}
      apiVersion={apiVersion}
    />
  );
}

/**
 * Props for the versioned KubeadmControlPlane detail view.
 */
interface KubeadmControlPlaneDetailWithDataProps extends KubeadmControlPlaneDetailContentProps {
  /** The resource class bound to the detected API version */
  VersionedKCP: typeof KubeadmControlPlane;
  /** The detected CAPI API version (e.g., v1beta1, v1beta2) */
  apiVersion: string;
}

/**
 * Renders the final KubeadmControlPlane detail view with all fetched data.
 *
 * @param props - Component properties including the versioned class and version.
 */
function KubeadmControlPlaneDetailWithData({
  crName,
  namespace,
  VersionedKCP,
  crdName,
}: KubeadmControlPlaneDetailWithDataProps) {
  const [crd] = CustomResourceDefinition.useGet(crdName, undefined);
  const [item, itemError] = VersionedKCP.useGet(crName, namespace ?? undefined);

  if (itemError && !item) {
    return (
      <EmptyContent color="error">
        Error loading KubeadmControlPlane {crName}: {itemError?.message}
      </EmptyContent>
    );
  }
  if (!item) return <Loader title="Loading KubeadmControlPlane details" />;

  const spec = item.spec;
  const failure = item.failure;
  const initialized = getKCPInitialized(item.jsonData);

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
      name: 'Cluster',
      value: item.metadata?.labels?.['cluster.x-k8s.io/cluster-name'] ?? '-',
    },
    {
      name: 'Replicas',
      value: renderReplicas(item),
      hide: !showReplicas(item),
    },
    {
      name: 'Initialized',
      value:
        initialized !== undefined ? (
          <StatusLabel status={initialized ? 'success' : 'warning'}>
            {initialized ? 'True' : 'False'}
          </StatusLabel>
        ) : (
          '-'
        ),
    },
    {
      name: 'Update Strategy',
      value: renderUpdateStrategy(item),
      hide: !showUpdateStrategy(item),
    },
    {
      name: 'Version',
      value: spec?.version ?? '-',
    },
    {
      name: 'Observed Generation',
      value:
        item.status?.observedGeneration !== undefined
          ? `${item.status?.observedGeneration} / ${item.metadata?.generation ?? '-'}`
          : '-',
      hide: item.status?.observedGeneration === undefined,
    },
    ...(failure?.failureReason
      ? [
          {
            name: 'Failure Reason',
            value: <StatusLabel status="error">{failure.failureReason}</StatusLabel>,
          },
        ]
      : []),
    ...(failure?.failureMessage
      ? [
          {
            name: 'Failure Message',
            value: (
              <Typography component="span" sx={{ color: 'error.main' }}>
                {failure.failureMessage}
              </Typography>
            ),
          },
        ]
      : []),
    ...(item.deletionTimeouts
      ? [
          {
            name: 'Node Drain Timeout',
            value: item.deletionTimeouts.nodeDrain ?? '-',
          },
          {
            name: 'Node Volume Detach Timeout',
            value: item.deletionTimeouts.nodeVolumeDetach ?? '-',
          },
          {
            name: 'Node Deletion Timeout',
            value: item.deletionTimeouts.nodeDeletion ?? '-',
          },
        ]
      : []),
  ];

  const kubeadmConfigSpec = spec?.kubeadmConfigSpec;

  return (
    <DetailsGrid
      resourceType={VersionedKCP}
      withEvents
      name={crName}
      namespace={namespace ?? undefined}
      extraInfo={() => extraInfo}
      extraSections={kcp => [
        {
          id: 'cluster-api.kcp-conditions',
          section: (
            <ConditionsSection
              resource={{
                ...kcp.jsonData,
                status: {
                  ...kcp.jsonData.status,
                  conditions: kcp.conditions,
                },
              }}
            />
          ),
        },
        {
          id: 'cluster-api.kcp-machines',
          section: <OwnedMachinesSection resource={kcp} hideColumns={['owner']} />,
        },

        {
          id: 'cluster-api.kcp-machine-template',
          section: (
            <SectionBox title="Machine Template">
              <TemplateSection item={kcp} />
            </SectionBox>
          ),
        },
        ...(kcp.lastRemediation
          ? [
              {
                id: 'cluster-api.kcp-remediation',
                section: (
                  <SectionBox title="Remediation">
                    <SimpleTable
                      columns={[
                        {
                          label: 'Machine',
                          getter: (row: { machine: string }) => row.machine,
                        },
                        {
                          label: 'Time',
                          getter: (row: { time: string }) => localeDate(row.time),
                        },
                        {
                          label: 'Retry Count',
                          getter: (row: { retryCount: number }) => row.retryCount,
                        },
                      ]}
                      data={[kcp.lastRemediation]}
                    />
                  </SectionBox>
                ),
              },
            ]
          : []),

        ...(kubeadmConfigSpec
          ? [
              {
                id: 'cluster-api.kcp-kubeadm-config-spec',
                section: (
                  <KubeadmConfigSection
                    kubeadmConfigSpec={kubeadmConfigSpec}
                    title="KubeadmConfig Spec"
                  />
                ),
              },
            ]
          : []),
      ]}
    />
  );
}
