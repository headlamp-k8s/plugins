/**
 * Strimzi API version detection.
 *
 * Strimzi 1.0.0 promoted all CRDs to `v1` and removed `v1beta2`.
 * This module probes the API group discovery endpoint once per page load
 * and returns whichever version the connected cluster actually serves.
 * Components use this to build correct API paths without a hard cutover.
 */
import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';

export interface StrimziApiVersions {
  /** Version served by `kafka.strimzi.io` (Kafka, KafkaTopic, KafkaUser, KafkaNodePool, …). */
  kafka: string;
  /** Version served by `core.strimzi.io` (StrimziPodSet). */
  core: string;
}

/** Safe default used before the probe completes (or if discovery is unreachable). */
const DEFAULT_VERSIONS: StrimziApiVersions = { kafka: 'v1beta2', core: 'v1beta2' };

let _cache: StrimziApiVersions | null = null;
/** Single shared probe promise — ensures discovery is only attempted once. */
let _probePromise: Promise<StrimziApiVersions> | null = null;

async function probeGroup(group: string): Promise<string> {
  try {
    const data = await ApiProxy.request(`/apis/${group}`);
    const served: string[] = (data?.versions ?? []).map(
      (v: { version: string }) => v.version
    );
    return served.includes('v1') ? 'v1' : 'v1beta2';
  } catch {
    return 'v1beta2';
  }
}

/**
 * Resolves the Strimzi API versions available on the current cluster.
 * The result is cached after the first successful probe; subsequent calls
 * return the cached value immediately.
 */
export function resolveStrimziApiVersions(): Promise<StrimziApiVersions> {
  if (_cache) return Promise.resolve(_cache);
  if (!_probePromise) {
    _probePromise = Promise.all([
      probeGroup('kafka.strimzi.io'),
      probeGroup('core.strimzi.io'),
    ]).then(([kafka, core]) => {
      _cache = { kafka, core };
      return _cache;
    });
  }
  return _probePromise;
}

/**
 * Returns the cached versions synchronously.
 * Returns the default (`v1beta2`) before the probe completes.
 */
export function getStrimziApiVersions(): StrimziApiVersions {
  return _cache ?? DEFAULT_VERSIONS;
}

/** Clears the cache (useful in tests). */
export function _resetStrimziApiVersionCache(): void {
  _cache = null;
  _probePromise = null;
}
