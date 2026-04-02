import {
  ConditionsSection,
  DetailsGrid,
  EmptyContent,
  Link,
  Loader,
  type NameValueTableRow,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { Box, Typography } from '@mui/material';
import React, { useMemo } from 'react';
import { useParams } from 'react-router';
import { getCondition } from '../../resources/common';
import { getKCConditions, getKCFailure, KubeadmConfig } from '../../resources/kubeadmconfig';
import { useCapiApiVersion } from '../../utils/capiVersion';
import {
  getExtraColumnsFromCrd,
  getExtraInfoFromPrinterColumns,
} from '../../utils/crdPrinterColumns';
import { KubeadmConfigSection } from '../common/index';
import { renderConditionStatus } from '../common/util';

type KubeadmConfigNode = { kubeObject: KubeadmConfig };

export function KubeadmConfigDetail({ node }: { node?: KubeadmConfigNode }) {
  const { name: nameParam, namespace: namespaceParam } = useParams<{
    name: string;
    namespace: string;
  }>();

  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;

  if (!crName) return <EmptyContent color="error">Missing resource name</EmptyContent>;

  return (
    <KubeadmConfigDetailContent
      crName={crName}
      namespace={namespace}
      crdName={KubeadmConfig.crdName}
    />
  );
}

interface KubeadmConfigDetailContentProps {
  crName: string;
  namespace?: string;
  crdName: string;
}

interface KubeadmConfigDetailContentPropsWithVersion extends KubeadmConfigDetailContentProps {
  VersionedKubeadmConfig: typeof KubeadmConfig;
  apiVersion: string;
}

function KubeadmConfigDetailContent(props: KubeadmConfigDetailContentProps) {
  const { crdName } = props;
  const apiVersion = useCapiApiVersion(crdName, 'v1beta1');
  const VersionedKubeadmConfig = useMemo(
    () => (apiVersion ? KubeadmConfig.withApiVersion(apiVersion) : KubeadmConfig),
    [apiVersion]
  );

  if (!apiVersion) return <Loader title="Detecting Cluster API version" />;

  return (
    <KubeadmConfigDetailContentWithData
      {...props}
      VersionedKubeadmConfig={VersionedKubeadmConfig}
      apiVersion={apiVersion}
    />
  );
}

function KubeadmConfigDetailContentWithData({
  crName,
  namespace,
  crdName,
  VersionedKubeadmConfig,
  apiVersion,
}: KubeadmConfigDetailContentPropsWithVersion) {
  const [crd, crdError] = CustomResourceDefinition.useGet(crdName, undefined);
  const [item, itemError] = VersionedKubeadmConfig.useGet(crName, namespace ?? undefined);

  if (itemError && !item) {
    return (
      <EmptyContent color="error">
        Error loading KubeadmConfig {crName}: {itemError?.message}
      </EmptyContent>
    );
  }
  if (!item) return <Loader title="Loading KubeadmConfig details" />;

  const spec = item.spec;
  const status = item.status;
  const failure = getKCFailure(item.jsonData);
  const clusterName = item.metadata?.labels?.['cluster.x-k8s.io/cluster-name'];
  const machineName = item.metadata?.labels?.['cluster.x-k8s.io/machine-name'];

  const extraInfo = (() => {
    const info: NameValueTableRow[] = [
      {
        name: 'Cluster',
        value: clusterName ? (
          <Link
            routeName="capicluster"
            params={{ name: clusterName, namespace: item.metadata?.namespace }}
          >
            {clusterName}
          </Link>
        ) : (
          '-'
        ),
      },
      {
        name: 'Machine',
        value: machineName ?? '-',
        hide: !machineName,
      },
      {
        name: 'Ready',
        value: renderConditionStatus(undefined, getCondition(item.conditions, 'Ready'), {
          trueLabel: 'true',
          falseLabel: 'false',
          trueStatus: 'success',
          falseStatus: 'error',
        }),
      },
      {
        name: 'Data Secret',
        value: status?.dataSecretName ?? '-',
        hide: !status?.dataSecretName,
      },
      {
        name: 'Observed Generation',
        value:
          status?.observedGeneration !== undefined
            ? `${status.observedGeneration} / ${item.metadata?.generation ?? '-'}`
            : '-',
        hide: status?.observedGeneration === undefined,
      },
      {
        name: 'Format',
        value: spec?.format ?? '-',
        hide: !spec?.format,
      },
      {
        name: 'Verbosity',
        value: spec?.verbosity !== undefined ? String(spec.verbosity) : '-',
        hide: spec?.verbosity === undefined,
      },
      {
        name: 'NTP',
        value: spec?.ntp
          ? `${spec.ntp.enabled ? 'Enabled' : 'Disabled'}${
              spec.ntp.servers?.length ? ` — ${spec.ntp.servers.join(', ')}` : ''
            }`
          : '-',
        hide: !spec?.ntp,
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

    if (crd) {
      info.unshift({
        name: 'Definition',
        value: (
          <Link routeName="crd" params={{ name: crdName }}>
            {crdName}
          </Link>
        ),
      });
      info.push(
        ...getExtraInfoFromPrinterColumns(getExtraColumnsFromCrd(crd, apiVersion), item.jsonData)
      );
    } else if (crdError) {
      info.push({ name: 'Additional info', value: 'Some extra details could not be loaded.' });
    }

    return info;
  })();

  return (
    <DetailsGrid
      resourceType={VersionedKubeadmConfig}
      withEvents
      name={crName}
      namespace={namespace ?? undefined}
      extraInfo={extraInfo}
      extraSections={kc => {
        const conditions = getKCConditions(kc.jsonData);
        return [
          {
            id: 'cluster-api.kubeadm-config-conditions',
            section: (
              <ConditionsSection
                resource={{
                  ...kc.jsonData,
                  status: { ...kc.jsonData.status, conditions },
                }}
              />
            ),
          },
          ...(spec?.files?.length
            ? [
                {
                  id: 'cluster-api.kubeadm-config-files',
                  section: (
                    <SectionBox title="Files">
                      <SimpleTable
                        columns={[
                          { label: 'Path', getter: (r: any) => r.path },
                          { label: 'Owner', getter: (r: any) => r.owner ?? '-' },
                          { label: 'Permissions', getter: (r: any) => r.permissions ?? '-' },
                          { label: 'Encoding', getter: (r: any) => r.encoding ?? 'plain' },
                          { label: 'Append', getter: (r: any) => String(r.append ?? false) },
                          {
                            label: 'Source',
                            getter: (r: any) =>
                              r.contentFrom?.secret
                                ? `secret:${r.contentFrom.secret.name}/${r.contentFrom.secret.key}`
                                : r.content
                                ? '(inline)'
                                : '-',
                          },
                        ]}
                        data={spec.files}
                      />
                    </SectionBox>
                  ),
                },
              ]
            : []),
          ...(spec?.users?.length
            ? [
                {
                  id: 'cluster-api.kubeadm-config-users',
                  section: (
                    <SectionBox title="Users">
                      <SimpleTable
                        columns={[
                          { label: 'Name', getter: (r: any) => r.name },
                          { label: 'Shell', getter: (r: any) => r.shell ?? '-' },
                          { label: 'Groups', getter: (r: any) => r.groups ?? '-' },
                          { label: 'Home Dir', getter: (r: any) => r.homeDir ?? '-' },
                          { label: 'Inactive', getter: (r: any) => String(r.inactive ?? false) },
                          {
                            label: 'Passwd From',
                            getter: (r: any) =>
                              r.passwdFrom?.secret
                                ? `${r.passwdFrom.secret.name}/${r.passwdFrom.secret.key}`
                                : '-',
                          },
                        ]}
                        data={spec.users}
                      />
                    </SectionBox>
                  ),
                },
              ]
            : []),
          ...(spec?.preKubeadmCommands?.length ||
          spec?.postKubeadmCommands?.length ||
          spec?.bootCommands?.length
            ? [
                {
                  id: 'cluster-api.kubeadm-config-commands',
                  section: (
                    <SectionBox title="Commands">
                    <Box>
                      {spec?.bootCommands?.length ? (
                        <Box sx={{ mb: 2 }}>
                          <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>Boot Commands</Typography>
                          <Typography
                            component="pre"
                            sx={{ ...codeStyle, m: 0 }}
                          >
                            {spec.bootCommands.join('\n')}
                          </Typography>
                        </Box>
                      ) : null}
                      {spec?.preKubeadmCommands?.length ? (
                        <Box sx={{ mb: 2 }}>
                          <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>Pre-Kubeadm Commands</Typography>
                          <Typography
                            component="pre"
                            sx={{ ...codeStyle, m: 0 }}
                          >
                            {spec.preKubeadmCommands.join('\n')}
                          </Typography>
                        </Box>
                      ) : null}
                      {spec?.postKubeadmCommands?.length ? (
                        <Box>
                          <Typography sx={{ fontWeight: 'bold', mb: 0.5 }}>Post-Kubeadm Commands</Typography>
                          <Typography
                            component="pre"
                            sx={{ ...codeStyle, m: 0 }}
                          >
                            {spec.postKubeadmCommands.join('\n')}
                          </Typography>
                        </Box>
                      ) : null}
                    </Box>
                    </SectionBox>
                  ),
                },
              ]
            : []),
          ...(spec?.diskSetup?.partitions?.length || spec?.diskSetup?.filesystems?.length
            ? [
                {
                  id: 'cluster-api.kubeadm-config-disk',
                  section: (
                    <SectionBox title="Disk Setup">
                      {spec.diskSetup?.partitions?.length ? (
                        <>
                          <strong>Partitions</strong>
                          <SimpleTable
                            columns={[
                              { label: 'Device', getter: (r: any) => r.device },
                              { label: 'Layout', getter: (r: any) => String(r.layout) },
                              {
                                label: 'Overwrite',
                                getter: (r: any) => String(r.overwrite ?? false),
                              },
                              { label: 'Table Type', getter: (r: any) => r.tableType ?? '-' },
                            ]}
                            data={spec.diskSetup.partitions}
                          />
                        </>
                      ) : null}
                      {spec.diskSetup?.filesystems?.length ? (
                        <>
                          <strong>Filesystems</strong>
                          <SimpleTable
                            columns={[
                              { label: 'Device', getter: (r: any) => r.device },
                              { label: 'Filesystem', getter: (r: any) => r.filesystem },
                              { label: 'Label', getter: (r: any) => r.label ?? '-' },
                              {
                                label: 'Overwrite',
                                getter: (r: any) => String(r.overwrite ?? false),
                              },
                            ]}
                            data={spec.diskSetup.filesystems}
                          />
                        </>
                      ) : null}
                    </SectionBox>
                  ),
                },
              ]
            : []),
          ...(spec
            ? [
                {
                  id: 'cluster-api.kubeadm-config-spec',
                  section: (
                    <KubeadmConfigSection kubeadmConfigSpec={spec} title="KubeadmConfig Spec" />
                  ),
                },
              ]
            : []),
        ];
      }}
    />
  );
}

const codeStyle: React.CSSProperties = {
  margin: '4px 0 12px',
  padding: '8px 12px',
  fontSize: '0.82rem',
  overflowX: 'auto',
  background: 'var(--code-bg, #1e1e1e)',
  color: 'var(--code-fg, #d4d4d4)',
  borderRadius: 4,
};
