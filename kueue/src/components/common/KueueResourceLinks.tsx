import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Link } from '@kinvolk/headlamp-plugin/lib/components/common';
import type {
  KubeObject,
  KubeObjectInterface,
  KubeOwnerReference,
} from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Fragment } from 'react';
import { renderParentNameDisplay } from '../../resources/cohortFormatters';
import { kueueRouteNames } from '../../utils/kueueRoutes';

/** Render an AdmissionCheck reference as a detail-page link when present. */
export function renderAdmissionCheckLink(admissionCheckName?: string) {
  if (!admissionCheckName) {
    return '-';
  }

  return (
    <Link routeName={kueueRouteNames.admissionCheckDetail} params={{ name: admissionCheckName }}>
      {admissionCheckName}
    </Link>
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

/**
 * Render owner references as links to Headlamp's detail pages in the given namespace.
 * Kinds Headlamp has no page for stay as Kind/name text.
 */
export function renderOwnerReferenceLinks(
  ownerReferences: KubeOwnerReference[] = [],
  namespace?: string,
  cluster?: string
) {
  if (ownerReferences.length === 0) {
    return '-';
  }

  return ownerReferences.map((reference, index) => {
    const resourceClass = K8s.ResourceClasses[reference.kind as keyof typeof K8s.ResourceClasses];
    const label = `${reference.kind}/${reference.name}`;
    const linkable =
      namespace &&
      resourceClass?.isNamespaced &&
      [resourceClass.apiVersion].flat().includes(reference.apiVersion);
    // Build the owner as a KubeObject so Link resolves its URL through getDetailsLink(),
    // which also works for plugin classes whose detailsRoute is a path template.
    const ResourceType = resourceClass as unknown as new (
      jsonData: KubeObjectInterface,
      cluster?: string
    ) => KubeObject;
    const owner = linkable
      ? new ResourceType(
          {
            apiVersion: reference.apiVersion,
            kind: reference.kind,
            metadata: { name: reference.name, namespace, uid: reference.uid },
          } as KubeObjectInterface,
          cluster
        )
      : undefined;

    return (
      <Fragment key={reference.uid || label}>
        {index > 0 && ', '}
        {owner ? <Link kubeObject={owner}>{label}</Link> : label}
      </Fragment>
    );
  });
}
