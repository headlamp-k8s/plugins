import {
  DetailsGrid,
  EmptyContent,
  Link,
  Loader,
  type NameValueTableRow,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { Typography } from '@mui/material';
import React, { useMemo } from 'react';
import { useParams } from 'react-router';
import { getKCTFailure, KubeadmConfigTemplate } from '../../resources/kubeadmconfigtemplate';
import { useCapiApiVersion } from '../../utils/capiVersion';

type KubeadmConfigTemplateNode = { kubeObject: KubeadmConfigTemplate };

/**
 * Main detail view for a KubeadmConfigTemplate resource.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#bootstrap-template
 *
 * @param props - Component properties including optional node from a list.
 */
export function KubeadmConfigTemplateDetail({ node }: { node?: KubeadmConfigTemplateNode }) {
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();

  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;

  if (!crName) return <EmptyContent color="error">Missing resource name</EmptyContent>;

  return (
    <KubeadmConfigTemplateDetailContent
      crName={crName}
      namespace={namespace}
      crdName={KubeadmConfigTemplate.crdName}
    />
  );
}

interface KCTProps {
  /** The resource name from the URL params */
  crName: string;
  /** The namespace from the URL params */
  namespace?: string;
  /** The fully qualified CRD name */
  crdName: string;
}

/**
 * Props for the versioned KCT detail view.
 */
interface KCTDetailWithVersionProps extends KCTProps {
  /** The resource class bound to the detected API version */
  VersionedKCT: typeof KubeadmConfigTemplate;
  /** The detected CAPI API version (e.g., v1beta1, v1beta2) */
  apiVersion: string;
}

function KubeadmConfigTemplateDetailContent(props: KCTProps) {
  const { crName, namespace, crdName } = props;
  const apiVersion = useCapiApiVersion(crdName, 'v1beta1');
  const VersionedKCT = useMemo(
    () => (apiVersion ? KubeadmConfigTemplate.withApiVersion(apiVersion) : KubeadmConfigTemplate),
    [apiVersion]
  );

  if (!apiVersion) return <Loader title="Detecting Cluster API version" />;

  return (
    <KubeadmConfigTemplateDetailWithData
      crName={crName}
      namespace={namespace}
      crdName={crdName}
      VersionedKCT={VersionedKCT}
      apiVersion={apiVersion}
    />
  );
}

function KubeadmConfigTemplateDetailWithData(props: KCTDetailWithVersionProps) {
  const { crName, namespace, crdName, VersionedKCT } = props;
  const [crd] = CustomResourceDefinition.useGet(crdName, undefined);
  const [item, itemError] = VersionedKCT.useGet(crName, namespace ?? undefined);

  if (itemError && !item) {
    return (
      <EmptyContent color="error">
        Error loading KubeadmConfigTemplate {crName}: {itemError?.message}
      </EmptyContent>
    );
  }
  if (!item) return <Loader title="Loading KubeadmConfigTemplate details" />;

  const failure = getKCTFailure(item.jsonData);
  const configSpec = item.configSpec;
  const templateMeta = item.spec?.template?.metadata;

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
      name: 'Observed Generation',
      value:
        item.observedGeneration !== undefined
          ? `${item.observedGeneration} / ${item.metadata?.generation ?? '-'}`
          : '-',
      hide: item.observedGeneration === undefined,
    },
    ...(templateMeta?.labels && Object.keys(templateMeta.labels).length
      ? [
          {
            name: 'Template Labels',
            value: (
              <Typography component="span">
                {Object.entries(templateMeta.labels)
                  .map(([k, v]) => `${k}=${v}`)
                  .join(', ')}
              </Typography>
            ),
          },
        ]
      : []),
    ...(templateMeta?.annotations && Object.keys(templateMeta.annotations).length
      ? [
          {
            name: 'Template Annotations',
            value: (
              <Typography component="span">
                {Object.entries(templateMeta.annotations)
                  .map(([k, v]) => `${k}=${v}`)
                  .join(', ')}
              </Typography>
            ),
          },
        ]
      : []),
    {
      name: 'Config Format',
      value: configSpec?.format ?? '-',
      hide: !configSpec?.format,
    },
    {
      name: 'NTP Servers',
      value: configSpec?.ntp?.servers?.join(', ') ?? '-',
      hide: !configSpec?.ntp?.servers?.length,
    },
    {
      name: 'Users',
      value: configSpec?.users?.map(u => u.name).join(', ') ?? '-',
      hide: !configSpec?.users?.length,
    },
    {
      name: 'Verbosity',
      value: configSpec?.verbosity !== undefined ? String(configSpec.verbosity) : '-',
      hide: configSpec?.verbosity === undefined,
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
  ];

  return (
    <DetailsGrid
      resourceType={VersionedKCT}
      withEvents
      name={crName}
      namespace={namespace ?? undefined}
      extraInfo={() => extraInfo}
    />
  );
}
