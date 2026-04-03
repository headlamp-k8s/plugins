import {
  ConditionsSection,
  DetailsGrid,
  EmptyContent,
  Link,
  Loader,
  MetadataDictGrid,
  type NameValueTableRow,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { Typography } from '@mui/material';
import { useMemo } from 'react';
import { useParams } from 'react-router';
import { MachineSet } from '../../resources/machineset';
import { useCapiApiVersion } from '../../utils/capiVersion';
import {
  OwnedMachinesSection,
  renderReplicas,
  showReplicas,
  TemplateSection,
} from '../common/index';

/**
 * Props for the MachineSetDetail component.
 * @see https://cluster-api.sigs.k8s.io/concepts/machineset/
 */
interface MachineSetDetailProps {
  /** The Headlamp node object containing the MachineSet resource */
  node?: {
    /** The actual MachineSet resource object */
    kubeObject: MachineSet;
  };
}

/**
 * Main detail view component for the MachineSet resource.
 */
export function MachineSetDetail({ node }: MachineSetDetailProps) {
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();
  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;

  if (!crName) return <EmptyContent color="error">Missing resource name</EmptyContent>;

  return (
    <MachineSetDetailContent crName={crName} namespace={namespace} crdName={MachineSet.crdName} />
  );
}

/**
 * Props for the MachineSetDetailContent wrapper.
 */
interface MachineSetDetailContentProps {
  /** The resource name from the URL params */
  crName: string;
  /** The namespace from the URL params */
  namespace?: string;
  /** The fully qualified CRD name */
  crdName: string;
}

/**
 * Props for the versioned MachineSet detail view.
 */
interface MachineSetDetailContentPropsWithVersion extends MachineSetDetailContentProps {
  /** The resource class bound to the detected API version */
  VersionedMachineSet: typeof MachineSet;
  /** The detected CAPI API version (e.g., v1beta1, v1beta2) */
  apiVersion: string;
}

/**
 * Renders the final MachineSet detail view with all fetched data.
 *
 * @param props - Component properties including the versioned class and version.
 */
function MachineSetDetailContentWithData({
  crName,
  namespace,
  VersionedMachineSet,
  crdName,
}: MachineSetDetailContentPropsWithVersion) {
  const [crd] = CustomResourceDefinition.useGet(crdName, undefined);
  const [item, itemError] = VersionedMachineSet.useGet(crName, namespace ?? undefined);

  if (itemError && !item) {
    return (
      <EmptyContent color="error">
        Error loading MachineSet {crName}: {itemError?.message}
      </EmptyContent>
    );
  }
  if (!item) return <Loader title="Loading MachineSet details" />;

  const spec = item.spec;
  const status = item.status;
  const failure = item.failure;

  const deleteOrder = spec?.deletion?.order ?? spec?.deletePolicy ?? 'Random (default)';

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
      value: spec?.clusterName ?? '-',
    },
    {
      name: 'Replicas',
      value: renderReplicas(item),
      hide: !showReplicas(item),
    },
    {
      name: 'Delete Policy',
      value: deleteOrder,
    },
    {
      name: 'Min Ready Seconds',
      value: spec?.minReadySeconds ?? 0,
    },
    {
      name: 'Machine Naming Strategy',
      value: spec?.machineNamingStrategy?.template ?? '-',
      hide: !spec?.machineNamingStrategy?.template,
    },
    {
      name: 'Selector',
      value: spec?.selector?.matchLabels ? (
        <MetadataDictGrid dict={spec.selector.matchLabels as Record<string, string>} />
      ) : (
        '-'
      ),
    },
    {
      name: 'Observed Generation',
      value:
        status?.observedGeneration !== undefined
          ? `${status.observedGeneration} / ${item.metadata?.generation ?? '-'}`
          : '-',
      hide: status?.observedGeneration === undefined,
    },
    // Failure fields — resolved across v1beta1 (root) and v1beta2 (deprecated.v1beta1)
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
  ];

  return (
    <DetailsGrid
      resourceType={VersionedMachineSet}
      withEvents
      name={crName}
      namespace={namespace ?? undefined}
      extraInfo={() => extraInfo}
      extraSections={() => [
        {
          id: 'cluster-api.machine-set-conditions',
          section: (
            <ConditionsSection
              resource={{
                ...item.jsonData,
                status: {
                  ...item.jsonData.status,
                  conditions: item.conditions,
                },
              }}
            />
          ),
        },
        {
          id: 'cluster-api.machine-set-machines',
          section: (
            <OwnedMachinesSection resource={item} hideColumns={['owner']} showCreateButton />
          ),
        },
        {
          id: 'cluster-api.machine-set-template',
          section: (
            <SectionBox title="Machine Template">
              <TemplateSection item={item} />
            </SectionBox>
          ),
        },
      ]}
    />
  );
}

/**
 * Wrapper component to detect CAPI API version for a MachineSet.
 *
 * @param props - Component properties.
 */
function MachineSetDetailContent(props: MachineSetDetailContentProps) {
  const { crdName } = props;
  const apiVersion = useCapiApiVersion(crdName, 'v1beta1');
  const VersionedMachineSet = useMemo(
    () => (apiVersion ? MachineSet.withApiVersion(apiVersion) : MachineSet),
    [apiVersion]
  );
  if (!apiVersion) return <Loader title="Detecting Cluster API version" />;
  return (
    <MachineSetDetailContentWithData
      {...props}
      VersionedMachineSet={VersionedMachineSet}
      apiVersion={apiVersion}
    />
  );
}
