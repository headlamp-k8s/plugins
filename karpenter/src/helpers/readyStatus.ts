/**
 * Maps the `Ready` status condition of a Karpenter resource to the text shown
 * in a list's Status column.
 *
 * Kubernetes status conditions are tri-state: `True`, `False` and `Unknown`,
 * and the condition may also be missing entirely while the controller has not
 * reported yet. Collapsing all three of those into "Not Ready" makes a
 * resource that is still reconciling look broken, so each state gets its own
 * label.
 *
 * This is not a full match for `common/StatusLabel.tsx`, which the details
 * views use. The two agree on `Unknown` and on a missing condition, but
 * `StatusLabel` shows "Failed" rather than "Not Ready" for `False`, and it has
 * two states that have no equivalent in a list column: "Waiting" for the
 * `DependencyNotReady` reason and "Suspended" when `spec.suspend` is set.
 */

interface StatusCondition {
  type?: string;
  status?: string;
}

interface WithStatusConditions {
  jsonData?: {
    status?: {
      conditions?: StatusCondition[];
    };
  };
}

/** Translator function, so callers can pass `t` from `useTranslation()`. */
type Translate = (key: string) => string;

const identity: Translate = key => key;

export function getReadyStatus(resource: WithStatusConditions, t: Translate = identity): string {
  const conditions = resource?.jsonData?.status?.conditions || [];
  const readyCondition = conditions.find(c => c.type === 'Ready');

  if (!readyCondition) {
    return '-';
  }

  switch (readyCondition.status) {
    case 'True':
      return t('Ready');
    case 'False':
      return t('Not Ready');
    default:
      // `Unknown`, or anything else the controller may report.
      return t('Reconciling…');
  }
}
