import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  ObjectEventList,
  SectionBox,
  SimpleTable,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import {
  Link as HeadlampLink,
  MainInfoSection,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useParams } from 'react-router-dom';
import { Waypoint } from '../../resources/waypoint';
import { kmeshRoutePaths } from '../../utils/kmeshRoutes';

/** Label the Gateway API deployer sets on the proxy Pod/Service it creates for a Gateway. */
const GATEWAY_NAME_LABEL = 'istio.io/gateway-name';
/** Label a Namespace carries when its workloads are enrolled to use a specific waypoint. */
const USE_WAYPOINT_LABEL = 'istio.io/use-waypoint';

/**
 * Props for the Waypoint Detail view component.
 *
 * @see https://kmesh.net/docs/architecture/#waypoint
 * @see https://kmesh.net/docs/application-layer/install_waypoint#install-waypoint
 * @see https://kmesh.net/docs/kmeshctl/kmeshctl_waypoint#kmeshctl-waypoint
 */
interface WaypointDetailProps {
  /** The name of the waypoint resource */
  name?: string;
  /** The namespace where the waypoint is deployed */
  namespace?: string;
  /** The cluster ID the waypoint belongs to */
  cluster?: string;
}

const MISSING_PARAMS_ERROR = new Error(
  `Waypoint route params missing. Expected route: ${kmeshRoutePaths.waypointDetail}`
);

export default function WaypointDetail(props: WaypointDetailProps) {
  const params = useParams<{ namespace?: string; name?: string }>();
  const name = props.name ?? params.name;
  const namespace = props.namespace ?? params.namespace;
  const cluster = props.cluster;

  if (!name || !namespace) {
    return (
      <MainInfoSection
        resource={null}
        title="Waypoint Details"
        error={MISSING_PARAMS_ERROR}
        backLink={kmeshRoutePaths.waypointsList}
      />
    );
  }

  return <WaypointDetailContent name={name} namespace={namespace} cluster={cluster} />;
}

function ConditionsTable({ conditions }: { conditions?: any[] }) {
  if (!conditions || conditions.length === 0) {
    return null;
  }

  return (
    <SectionBox title="Conditions">
      <SimpleTable
        data={conditions}
        columns={[
          {
            label: 'Type',
            getter: (c: any) => c.type,
          },
          {
            label: 'Status',
            getter: (c: any) => {
              const statusType =
                c.status === 'True' ? 'success' : c.status === 'False' ? 'error' : 'warning';
              return <StatusLabel status={statusType}>{c.status}</StatusLabel>;
            },
          },
          {
            label: 'Reason',
            getter: (c: any) => c.reason,
          },
          {
            label: 'Message',
            getter: (c: any) => c.message,
          },
          {
            label: 'Last Transition',
            getter: (c: any) =>
              c.lastTransitionTime && !c.lastTransitionTime.startsWith('1970-01-01')
                ? new Date(c.lastTransitionTime).toLocaleString()
                : '-',
          },
        ]}
      />
    </SectionBox>
  );
}

interface RelatedResourceRow {
  label: string;
  resources: any[];
}

function RelatedResourcesTable({ rows }: { rows: RelatedResourceRow[] }) {
  return (
    <SectionBox title="Related Resources">
      <SimpleTable
        data={rows}
        columns={[
          {
            label: 'Resource Type',
            getter: (row: RelatedResourceRow) => row.label,
          },
          {
            label: 'Resources',
            getter: (row: RelatedResourceRow) =>
              row.resources.length > 0 ? (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {row.resources.map(resource => (
                    <HeadlampLink key={resource.metadata.uid} kubeObject={resource}>
                      {resource.getName()}
                    </HeadlampLink>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  None found
                </Typography>
              ),
          },
        ]}
      />
    </SectionBox>
  );
}

function WaypointRelatedResources({ name, namespace }: { name: string; namespace: string }) {
  const [proxyPods] = K8s.ResourceClasses.Pod.useList({
    namespace,
    labelSelector: `${GATEWAY_NAME_LABEL}=${name}`,
  });
  const [proxyServices] = K8s.ResourceClasses.Service.useList({
    namespace,
    labelSelector: `${GATEWAY_NAME_LABEL}=${name}`,
  });
  const [namespaces] = K8s.ResourceClasses.Namespace.useList();

  const enrolledNamespaces = (namespaces ?? []).filter(
    ns => ns.metadata?.labels?.[USE_WAYPOINT_LABEL] === name
  );

  return (
    <RelatedResourcesTable
      rows={[
        { label: 'Proxy Pods', resources: proxyPods ?? [] },
        { label: 'Proxy Service', resources: proxyServices ?? [] },
        { label: 'Namespaces Using This Waypoint', resources: enrolledNamespaces },
      ]}
    />
  );
}

function WaypointDetailContent({
  name,
  namespace,
  cluster,
}: {
  name: string;
  namespace: string;
  cluster?: string;
}) {
  const [waypoint, error] = Waypoint.useGet(name, namespace, { cluster });

  return (
    <>
      <MainInfoSection
        resource={waypoint}
        error={error}
        title="Waypoint Details"
        backLink={kmeshRoutePaths.waypointsList}
        extraInfo={[
          {
            name: 'Gateway Class',
            value: waypoint?.spec?.gatewayClassName,
          },
          {
            name: 'Image',
            value: waypoint?.image,
          },
          {
            name: 'Current Status',
            value: waypoint?.currentStatus,
          },
        ]}
      />
      {waypoint && <ConditionsTable conditions={waypoint.status?.conditions} />}
      {waypoint && <WaypointRelatedResources name={name} namespace={namespace} />}
      {waypoint && <ObjectEventList object={waypoint as any} />}
    </>
  );
}
