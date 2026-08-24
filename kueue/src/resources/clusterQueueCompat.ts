import { AdmissionChecksStrategyLike } from './clusterQueueFormatters';

/** Minimal spec shape needed to resolve cohort name across v1beta1 and v1beta2. */
export interface CohortSpecLike {
  /** Cohort name in v1beta2 (renamed from `cohort` in v1beta1). */
  cohortName?: string;
  /** Cohort name in v1beta1. */
  cohort?: string;
}

/** Minimal spec shape needed to resolve admission checks across v1beta1 and v1beta2. */
export interface AdmissionChecksSpecLike {
  /** v1beta2 structured strategy mapping AdmissionChecks to ResourceFlavors. */
  admissionChecksStrategy?: AdmissionChecksStrategyLike;
  /** v1beta1 flat list of AdmissionCheck names. */
  admissionChecks?: string[];
}

/**
 * Resolve the cohort name from either v1beta2 (`cohortName`) or v1beta1 (`cohort`).
 *
 * In v1beta2, the field is `cohortName`. In v1beta1, it was `cohort`.
 * The v1beta2 field takes priority when both are present.
 * Returns `undefined` when neither field is set.
 */
export function getCohortName(spec?: CohortSpecLike): string | undefined {
  return spec?.cohortName || spec?.cohort || undefined;
}

/**
 * Resolve the admission checks strategy from either v1beta2 (`admissionChecksStrategy`)
 * or v1beta1 (`admissionChecks`).
 *
 * In v1beta2, admission checks are structured under `admissionChecksStrategy.admissionChecks`
 * with optional per-flavor scoping. In v1beta1, admission checks are a flat string array
 * with no per-flavor scoping.
 *
 * When v1beta1 `admissionChecks` is present, it is converted into the v1beta2 strategy shape
 * so that existing formatters can render it uniformly.
 * The v1beta2 strategy takes priority when both are present and non-empty.
 */
export function getAdmissionChecksStrategy(
  spec?: AdmissionChecksSpecLike
): AdmissionChecksStrategyLike | undefined {
  if (spec?.admissionChecksStrategy?.admissionChecks?.length) {
    return spec.admissionChecksStrategy;
  }

  if (spec?.admissionChecks?.length) {
    return {
      admissionChecks: spec.admissionChecks.map(name => ({ name })),
    };
  }

  return spec?.admissionChecksStrategy;
}
