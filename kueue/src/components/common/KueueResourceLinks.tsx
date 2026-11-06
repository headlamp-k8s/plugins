import { Link } from '@kinvolk/headlamp-plugin/lib/components/common';
import { renderParentNameDisplay } from '../../resources/cohortFormatters';
import { kueueRouteNames } from '../../utils/kueueRoutes';

/** Render an AdmissionCheck reference as a detail-page link when present. */
export function renderAdmissionCheckLink(admissionCheckName?: string, cluster?: string) {
  if (!admissionCheckName) {
    return '-';
  }

  return (
    <Link
      routeName={kueueRouteNames.admissionCheckDetail}
      params={{ name: admissionCheckName }}
      activeCluster={cluster}
    >
      {admissionCheckName}
    </Link>
  );
}

/** Render a Cohort reference as a detail-page link when present. */
export function renderCohortLink(cohortName?: string, cluster?: string) {
  if (!cohortName) {
    return '-';
  }

  return (
    <Link
      routeName={kueueRouteNames.cohortDetail}
      params={{ name: cohortName }}
      activeCluster={cluster}
    >
      {cohortName}
    </Link>
  );
}

/** Render a parent Cohort reference, using Root when this Cohort has no parent. */
export function renderParentCohortLink(parentName?: string, cluster?: string) {
  if (!parentName) {
    return renderParentNameDisplay(parentName);
  }

  return renderCohortLink(parentName, cluster);
}

/** Render a ResourceFlavor reference as a detail-page link when present. */
export function renderResourceFlavorLink(flavorName?: string, cluster?: string) {
  if (!flavorName) {
    return '-';
  }

  return (
    <Link
      routeName={kueueRouteNames.resourceFlavorDetail}
      params={{ name: flavorName }}
      activeCluster={cluster}
    >
      {flavorName}
    </Link>
  );
}

/** Render a ClusterQueue reference as a detail-page link when present. */
export function renderClusterQueueLink(clusterQueueName?: string, cluster?: string) {
  if (!clusterQueueName) {
    return '-';
  }

  return (
    <Link
      routeName={kueueRouteNames.clusterQueueDetail}
      params={{ name: clusterQueueName }}
      activeCluster={cluster}
    >
      {clusterQueueName}
    </Link>
  );
}

/** Render a LocalQueue reference as a detail-page link when present. */
export function renderLocalQueueLink(queueName?: string, namespace?: string, cluster?: string) {
  if (!queueName || !namespace) {
    return '-';
  }

  return (
    <Link
      routeName={kueueRouteNames.localQueueDetail}
      params={{ namespace, name: queueName }}
      activeCluster={cluster}
    >
      {queueName}
    </Link>
  );
}
