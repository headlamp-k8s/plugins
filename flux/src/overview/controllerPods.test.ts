import { describe, expect, it } from 'vitest';
import { containerNamesForPod, getPodsForController } from './controllerPods';

function makePod(
  name: string,
  labels: Record<string, string>,
  phase = 'Running',
  namespace = 'flux-system'
) {
  return {
    metadata: { name, namespace, labels },
    status: { phase },
    getName: () => name,
  } as any;
}

function makeController(
  matchLabels: Record<string, string> | undefined,
  namespace = 'flux-system'
) {
  return {
    metadata: { name: 'source-controller', namespace },
    jsonData: { spec: { selector: matchLabels ? { matchLabels } : {} } },
  } as any;
}

describe('getPodsForController', () => {
  const controller = makeController({ app: 'source-controller' });

  it('returns an empty list while pods are still loading', () => {
    expect(getPodsForController(null, controller)).toEqual([]);
  });

  it('matches pods whose labels satisfy every selector entry', () => {
    const match = makePod('source-controller-abc', { app: 'source-controller' });
    const other = makePod('kustomize-controller-xyz', { app: 'kustomize-controller' });

    expect(getPodsForController([match, other], controller).map(p => p.getName())).toEqual([
      'source-controller-abc',
    ]);
  });

  it('requires all selector labels to match, not just one', () => {
    const multi = makeController({ app: 'source-controller', tier: 'control-plane' });
    const partial = makePod('partial', { app: 'source-controller' });

    expect(getPodsForController([partial], multi)).toEqual([]);
  });

  it('ignores pods from a different namespace', () => {
    const elsewhere = makePod(
      'source-controller-abc',
      { app: 'source-controller' },
      'Running',
      'other-ns'
    );

    expect(getPodsForController([elsewhere], controller)).toEqual([]);
  });

  it('treats a controller with no selector as having no pods', () => {
    const pod = makePod('anything', { app: 'source-controller' });

    expect(getPodsForController([pod], makeController(undefined))).toEqual([]);
  });

  it('orders running pods before pending ones', () => {
    const pending = makePod('aaa-pending', { app: 'source-controller' }, 'Pending');
    const running = makePod('zzz-running', { app: 'source-controller' }, 'Running');

    expect(getPodsForController([pending, running], controller).map(p => p.getName())).toEqual([
      'zzz-running',
      'aaa-pending',
    ]);
  });

  it('returns an empty list when the controller is scaled to zero', () => {
    expect(getPodsForController([], controller)).toEqual([]);
  });
});

describe('containerNamesForPod', () => {
  it('returns an empty list when there is no pod', () => {
    expect(containerNamesForPod(undefined)).toEqual([]);
  });

  it('returns container names in spec order', () => {
    const pod = { spec: { containers: [{ name: 'manager' }, { name: 'sidecar' }] } } as any;

    expect(containerNamesForPod(pod)).toEqual(['manager', 'sidecar']);
  });
});
