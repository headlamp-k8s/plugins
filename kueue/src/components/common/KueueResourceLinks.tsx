import { Link } from '@kinvolk/headlamp-plugin/lib/components/common';
import { kueueRouteNames } from '../../utils/kueueRoutes';

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
