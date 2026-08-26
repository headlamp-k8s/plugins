import { Link } from '@kinvolk/headlamp-plugin/lib/components/common';
import { renderParentNameDisplay } from '../../resources/cohortFormatters';
import { kueueRouteNames } from '../../utils/kueueRoutes';

/** Render a Cohort reference as a detail-page link when present. */
export function renderCohortLink(cohortName?: string) {
  if (!cohortName || cohortName === '-') {
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

/** Render a ResourceFlavor reference as a detail-page link when present. */
export function renderResourceFlavorLink(flavorName?: string) {
  if (!flavorName) {
    return '-';
  }

  return (
    <Link routeName={kueueRouteNames.resourceFlavorDetail} params={{ name: flavorName }}>
      {flavorName}
    </Link>
  );
}

/** Render a ClusterQueue reference as a detail-page link when present. */
export function renderClusterQueueLink(clusterQueueName?: string) {
  if (!clusterQueueName) {
    return '-';
  }

  return (
    <Link routeName={kueueRouteNames.clusterQueueDetail} params={{ name: clusterQueueName }}>
      {clusterQueueName}
    </Link>
  );
}

/** Render a LocalQueue reference as a detail-page link when present. */
export function renderLocalQueueLink(queueName?: string, namespace?: string) {
  if (!queueName || !namespace) {
    return '-';
  }

  return (
    <Link routeName={kueueRouteNames.localQueueDetail} params={{ namespace, name: queueName }}>
      {queueName}
    </Link>
  );
}
