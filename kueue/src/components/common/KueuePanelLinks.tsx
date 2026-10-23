import { Icon } from '@iconify/react';
import { Activity } from '@kinvolk/headlamp-plugin/lib';
import { ComponentType, MouseEvent, ReactNode } from 'react';
import { matchPath } from 'react-router-dom';
import { kueueIconName } from '../../map/kueueMapSource';
import { kueueRoutePaths } from '../../utils/kueueRoutes';
import AdmissionCheckDetail from '../admissionchecks/Detail';
import ClusterQueueDetail from '../clusterqueues/Detail';
import CohortDetail from '../cohorts/Detail';
import LocalQueueDetail from '../localqueues/Detail';
import ResourceFlavorDetail from '../resourceflavors/Detail';
import WorkloadDetail from '../workloads/Detail';

type DetailProps = { name?: string; namespace?: string; cluster?: string };

const panelDetails: { kind: string; path: string; Detail: ComponentType<DetailProps> }[] = [
  {
    kind: 'AdmissionCheck',
    path: kueueRoutePaths.admissionCheckDetail,
    Detail: AdmissionCheckDetail,
  },
  { kind: 'ClusterQueue', path: kueueRoutePaths.clusterQueueDetail, Detail: ClusterQueueDetail },
  { kind: 'Cohort', path: kueueRoutePaths.cohortDetail, Detail: CohortDetail },
  { kind: 'LocalQueue', path: kueueRoutePaths.localQueueDetail, Detail: LocalQueueDetail },
  {
    kind: 'ResourceFlavor',
    path: kueueRoutePaths.resourceFlavorDetail,
    Detail: ResourceFlavorDetail,
  },
  { kind: 'Workload', path: kueueRoutePaths.workloadDetail, Detail: WorkloadDetail },
];

/** Find the Kueue detail view a link's pathname points at, such as /c/main/kueue/workloads/ns/name. */
export function matchKueueDetailPath(pathname: string) {
  for (const { kind, path, Detail } of panelDetails) {
    const match = matchPath<{ cluster: string; namespace?: string; name: string }>(pathname, {
      path: `/c/:cluster${path}`,
      exact: true,
    });
    if (match) {
      // With several clusters selected the param is main+other, with the resource's cluster first.
      return { kind, Detail, ...match.params, cluster: match.params.cluster.split('+')[0] };
    }
  }
  return null;
}

/**
 * Get the app route a link points at. The desktop app routes in the hash, such as
 * index.html#/c/main/kueue/..., and web deployments may serve Headlamp under a base URL.
 */
export function getRoutePath(url: URL, baseUrl: string) {
  const path = url.hash.startsWith('#/') ? url.hash.slice(1).split('?')[0] : url.pathname;
  return baseUrl && path.startsWith(`${baseUrl}/`) ? path.slice(baseUrl.length) : path;
}

/** Headlamp's base URL, such as /headlamp, or an empty string when served at the root. */
function getBaseUrl() {
  const baseUrl = (window as { headlampBaseUrl?: string }).headlampBaseUrl ?? '';
  return baseUrl.startsWith('/') ? baseUrl.replace(/\/$/, '') : '';
}

/**
 * Headlamp opens links to built-in kinds inside its details panel, but a link to a plugin route
 * navigates the main page and leaves the panel open beside it. Open Kueue links clicked inside
 * the panel in the panel instead. Outside the panel, links navigate as usual.
 */
export default function KueuePanelLinks({ children }: { children: ReactNode }) {
  return <div onClickCapture={openKueueLinkInPanel}>{children}</div>;
}

function openKueueLinkInPanel(event: MouseEvent<HTMLDivElement>) {
  const link = (event.target as HTMLElement).closest('a');
  if (
    !link ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    // Headlamp's details panel is rendered as a complementary landmark.
    !event.currentTarget.closest('[role="complementary"]')
  ) {
    return;
  }

  const target = matchKueueDetailPath(getRoutePath(new URL(link.href), getBaseUrl()));
  if (!target) {
    return;
  }

  event.preventDefault();
  const { kind, Detail, cluster, namespace, name } = target;
  // The plugin types do not list kind yet.
  const activity: Parameters<typeof Activity.launch>[0] & { kind: 'details' } = {
    id: `kueue-details ${kind} ${cluster}/${namespace ?? ''}/${name}`,
    title: `${kind} ${name}`,
    hideTitleInHeader: true,
    location: 'split-right',
    cluster,
    temporary: true,
    // Newer Headlamp keeps details panels in the taskbar instead of closing them on outside clicks.
    kind: 'details',
    content: (
      <KueuePanelLinks>
        <Detail name={name} namespace={namespace} cluster={cluster} />
      </KueuePanelLinks>
    ),
    icon: <Icon icon={kueueIconName} width="100%" height="100%" />,
  };
  Activity.launch(activity);
}
