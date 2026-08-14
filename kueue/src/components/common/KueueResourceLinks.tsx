import { Link } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Link as MuiLink } from '@mui/material';
import { renderParentNameDisplay } from '../../resources/cohortFormatters';
import { kueueRouteNames } from '../../utils/kueueRoutes';
import { openClusterQueueActivity } from '../clusterqueues/Detail';
import { openLocalQueueActivity } from '../localqueues/Detail';
import { openResourceFlavorActivity } from '../resourceflavors/Detail';
import { openWorkloadActivity } from '../workloads/Detail';

/** Render a resource name as a link that opens its details in a side panel. */
export function renderSidePanelLink(label: string, onOpen: () => void) {
  return (
    <MuiLink component="button" sx={{ textAlign: 'left' }} onClick={onOpen}>
      {label}
    </MuiLink>
  );
}

/** Render a Cohort reference as a detail-page link when present. */
export function renderCohortLink(cohortName?: string) {
  if (!cohortName) {
    return '-';
  }

  return (
    <Link routeName={kueueRouteNames.cohortDetail} params={{ name: cohortName }}>
      {cohortName}
    </Link>
  );
}

/** Render a parent Cohort reference, using Root when this Cohort has no parent. */
export function renderParentCohortLink(parentName?: string) {
  if (!parentName) {
    return renderParentNameDisplay(parentName);
  }

  return renderCohortLink(parentName);
}

/** Render a ResourceFlavor reference as a side-panel link when present. */
export function renderResourceFlavorLink(flavorName?: string, cluster?: string) {
  if (!flavorName) {
    return '-';
  }

  return renderSidePanelLink(flavorName, () => openResourceFlavorActivity(flavorName, cluster));
}

/** Render a ClusterQueue reference as a side-panel link when present. */
export function renderClusterQueueLink(clusterQueueName?: string, cluster?: string) {
  if (!clusterQueueName) {
    return '-';
  }

  return renderSidePanelLink(clusterQueueName, () =>
    openClusterQueueActivity(clusterQueueName, cluster)
  );
}

/** Render a LocalQueue reference as a side-panel link when present. */
export function renderLocalQueueLink(queueName?: string, namespace?: string, cluster?: string) {
  if (!queueName || !namespace) {
    return '-';
  }

  return renderSidePanelLink(queueName, () =>
    openLocalQueueActivity(namespace, queueName, cluster)
  );
}

/** Render a Workload reference as a side-panel link when present. */
export function renderWorkloadLink(workloadName?: string, namespace?: string, cluster?: string) {
  if (!workloadName || !namespace) {
    return '-';
  }

  return renderSidePanelLink(workloadName, () =>
    openWorkloadActivity(namespace, workloadName, cluster)
  );
}
