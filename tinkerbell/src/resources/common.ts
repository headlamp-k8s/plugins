import { KubeObjectInterface, Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export const TINKERBELL_API_GROUP = 'tinkerbell.org';
export const TINKERBELL_API_VERSION = `${TINKERBELL_API_GROUP}/v1alpha1`;

export type ConditionStatus = 'True' | 'False' | 'Unknown';

export interface TinkerbellCondition {
  type?: string;
  status?: ConditionStatus | string;
  reason?: string;
  message?: string;
  lastTransitionTime?: Time;
  observedGeneration?: number;
}

export interface TinkerbellResource extends KubeObjectInterface {
  spec?: Record<string, any>;
  status?: Record<string, any>;
}

export interface LocalObjectReference {
  name?: string;
  namespace?: string;
}

export function normalizeState(state: string | undefined): string {
  if (!state) {
    return 'Unknown';
  }

  return state
    .replace(/^STATE_/, '')
    .toLowerCase()
    .replace(
      /(^|_)([a-z])/g,
      (_, separator: string, letter: string) =>
        `${separator === '_' ? ' ' : ''}${letter.toUpperCase()}`
    );
}
