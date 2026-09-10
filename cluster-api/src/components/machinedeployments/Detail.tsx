import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
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
import { MachineDeployment } from '../../resources/machinedeployment';
import { useCapiApiVersion } from '../../utils/capiVersion';
import { getMachineDeploymentActions } from '../actions';
import {
  OwnedMachinesSection,
  renderReplicas,
  renderUpdateStrategy,
  showReplicas,
  showUpdateStrategy,
  TemplateSection,
} from '../common/index';
import { renderConditionStatus } from '../common/util';
/**
 * Props for the MachineDeploymentDetail component.
 * @see https://cluster-api.sigs.k8s.io/concepts/machinedeployment/
 */
interface MachineDeploymentDetailProps {
  /** The Headlamp node object containing the MachineDeployment resource */
  node?: {
    /** The actual MachineDeployment resource object */
    kubeObject: MachineDeployment;
  };
}

/**
 * Main detail view component for the MachineDeployment resource.
 */
export function MachineDeploymentDetail({ node }: MachineDeploymentDetailProps) {
  const { t } = useTranslation();
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();
  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;

  if (!crName) return <EmptyContent color="error">{t('Missing resource name')}</EmptyContent>;

  return (
    <MachineDeploymentDetailContent
      crName={crName}
      namespace={namespace}
      crdName={MachineDeployment.crdName}
    />
  );
}

/**
 * Props for the MachineDeploymentDetailContent wrapper.
 */
interface MachineDeploymentDetailContentProps {
  /** The resource name from the URL params */
  crName: string;
  /** The namespace from the URL params */
  namespace?: string;
  /** The fully qualified CRD name */
  crdName: string;
}

/**
 * Props for the versioned MachineDeployment detail view.
 */
interface MachineDeploymentDetailContentPropsWithVersion
  extends MachineDeploymentDetailContentProps {
  /** The resource class bound to the detected API version */
  VersionedMachineDeployment: typeof MachineDeployment;
  /** The detected CAPI API version (e.g., v1beta1, v1beta2) */
  apiVersion: string;
}

/**
 * Renders the final MachineDeployment detail view with all fetched data.
 *
 * @param props - Component properties including the versioned class and version.
 */
function MachineDeploymentDetailContentWithData(
  props: MachineDeploymentDetailContentPropsWithVersion
) {
  const { t } = useTranslation();
  const { crName, namespace, crdName, VersionedMachineDeployment } = props;
  const [crd] = CustomResourceDefinition.useGet(crdName, undefined);

  const [item, itemError] = VersionedMachineDeployment.useGet(crName, namespace ?? undefined);

  if (itemError && !item) {
    return (
      <EmptyContent color="error">
        {t('Error loading MachineDeployment {{crName}}: {{message}}', {
          crName,
          message: itemError?.message,
        })}
      </EmptyContent>
    );
  }
  if (!item) return <Loader title={t('Loading MachineDeployment details')} />;

  const spec = item.spec;
  const status = item.status;
  const failure = item.failure;

  const deleteOrder = spec?.deletion?.order ?? spec?.deletePolicy ?? 'Random (default)';

  const extraInfo: NameValueTableRow[] = [
    {
      name: t('Definition'),
      value: (
        <Link routeName="crd" params={{ name: crdName }}>
          {crdName}
        </Link>
      ),
      hide: !crd,
    },
    {
      name: t('Cluster'),
      value: spec?.clusterName ?? '-',
    },
    {
      name: t('Replicas'),
      value: renderReplicas(item, t) ?? '-',
      hide: !showReplicas(item),
    },
    {
      name: t('Strategy Type'),
      value: renderUpdateStrategy(item),
      hide: !showUpdateStrategy(item),
    },

    {
      name: t('Delete Policy'),
      value: deleteOrder,
    },
    {
      name: t('Min Ready Seconds'),
      value: spec?.minReadySeconds ?? 0,
    },
    {
      name: t('Paused'),
      value: renderConditionStatus(spec?.paused ? 'true' : 'false', undefined, {
        trueLabel: 'true',
        falseLabel: 'false',
        trueStatus: 'warning',
        falseStatus: 'success',
      }),
    },
    {
      name: t('Rollout After'),
      value: spec?.rolloutAfter
        ? new Date(spec.rolloutAfter).toLocaleString()
        : 'default (immediate)',
    },
    {
      name: t('Selector'),
      value: spec?.selector?.matchLabels ? (
        <MetadataDictGrid dict={spec.selector.matchLabels as Record<string, string>} />
      ) : (
        '-'
      ),
    },
    {
      name: t('Observed Generation'),
      value:
        status?.observedGeneration !== undefined
          ? `${status.observedGeneration} / ${item.metadata?.generation ?? '-'}`
          : '-',
      hide: status?.observedGeneration === undefined,
    },
    {
      name: t('Version'),
      value: spec?.template?.spec?.version ?? '-',
    },
    ...(failure?.failureReason
      ? [
          {
            name: t('Failure Reason'),
            value: <StatusLabel status="error">{failure.failureReason}</StatusLabel>,
          },
        ]
      : []),
    ...(failure?.failureMessage
      ? [
          {
            name: t('Failure Message'),
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
      resourceType={VersionedMachineDeployment}
      withEvents
      name={crName}
      namespace={namespace ?? undefined}
      actions={resource => (resource ? getMachineDeploymentActions(resource) : [])}
      extraInfo={() => extraInfo}
      extraSections={() => [
        {
          id: 'cluster-api.machine-deployment-machines',
          section: (
            <OwnedMachinesSection resource={item} hideColumns={['owner']} showCreateButton />
          ),
        },
        {
          id: 'cluster-api.machine-deployment-template',
          section: (
            <SectionBox title={t('Machine Template')}>
              <TemplateSection item={item} />
            </SectionBox>
          ),
        },
        {
          id: 'cluster-api.machine-deployment-conditions',
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
      ]}
    />
  );
}

/**
 * Wrapper component to detect CAPI API version for a MachineDeployment.
 *
 * @param props - Component properties.
 */
function MachineDeploymentDetailContent(props: MachineDeploymentDetailContentProps) {
  const { t } = useTranslation();
  const { crdName } = props;
  const apiVersion = useCapiApiVersion(crdName, 'v1beta1');
  const VersionedMachineDeployment = useMemo(
    () => (apiVersion ? MachineDeployment.withApiVersion(apiVersion) : MachineDeployment),
    [apiVersion]
  );
  if (!apiVersion) return <Loader title={t('Detecting Cluster API version')} />;
  return (
    <MachineDeploymentDetailContentWithData
      {...props}
      VersionedMachineDeployment={VersionedMachineDeployment}
      apiVersion={apiVersion}
    />
  );
}
