import { DetailsViewDefaultHeaderActions } from '@kinvolk/headlamp-plugin/lib';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { describe, expect, it, vi } from 'vitest';
import { type PluginConfig, store } from '../settings';
import {
  isManagedByFlux,
  processFluxHeaderActions,
  registerFluxHeaderActionsProcessor,
} from './headerActionsProcessor';

type HeaderActionsProcessor = (
  resource: KubeObject | null,
  headerActions: { id: string }[]
) => { id: string }[];

const registered = vi.hoisted(() => ({ processor: null as HeaderActionsProcessor | null }));

vi.mock('@kinvolk/headlamp-plugin/lib', async importOriginal => ({
  ...(await importOriginal<typeof import('@kinvolk/headlamp-plugin/lib')>()),
  registerDetailsViewHeaderActionsProcessor: (processor: HeaderActionsProcessor) => {
    registered.processor = processor;
  },
}));

const KUSTOMIZE_LABEL = 'kustomize.toolkit.fluxcd.io/name';
const HELM_LABEL = 'helm.toolkit.fluxcd.io/name';

function makeResource(kind: string, labels?: Record<string, string>, cluster = ''): KubeObject {
  return {
    cluster,
    jsonData: {
      kind,
      metadata: { name: 'podinfo', namespace: 'default', labels },
    },
  } as unknown as KubeObject;
}

function defaultHeaderActions() {
  return [
    { id: DetailsViewDefaultHeaderActions.RESTART },
    { id: DetailsViewDefaultHeaderActions.SCALE },
    { id: DetailsViewDefaultHeaderActions.EDIT },
    { id: DetailsViewDefaultHeaderActions.DELETE },
    { id: 'rollback' },
  ];
}

function ids(actions: { id: string }[]) {
  return actions.map(action => action.id);
}

describe('isManagedByFlux', () => {
  it('detects Kustomization-managed resources', () => {
    expect(isManagedByFlux(makeResource('Deployment', { [KUSTOMIZE_LABEL]: 'podinfo' }))).toBe(
      true
    );
  });

  it('detects HelmRelease-managed resources', () => {
    expect(isManagedByFlux(makeResource('Deployment', { [HELM_LABEL]: 'podinfo' }))).toBe(true);
  });

  it('ignores resources without Flux labels', () => {
    expect(isManagedByFlux(makeResource('Deployment', { app: 'podinfo' }))).toBe(false);
    expect(isManagedByFlux(makeResource('Deployment'))).toBe(false);
    expect(isManagedByFlux(null)).toBe(false);
  });
});

describe('processFluxHeaderActions', () => {
  it.each([false, true])(
    'leaves resources not managed by Flux untouched (allowMutatingActions=%s)',
    allow => {
      const actions = defaultHeaderActions();
      const result = processFluxHeaderActions(makeResource('Deployment'), actions, allow);
      expect(result).toBe(actions);
    }
  );

  it('leaves ephemeral Flux-managed kinds untouched', () => {
    const actions = defaultHeaderActions();
    const pod = makeResource('Pod', { [KUSTOMIZE_LABEL]: 'podinfo' });
    expect(processFluxHeaderActions(pod, actions, false)).toBe(actions);
  });

  it.each([KUSTOMIZE_LABEL, HELM_LABEL])(
    'hides mutating actions by default for resources labelled %s',
    label => {
      const resource = makeResource('Deployment', { [label]: 'podinfo' });
      const result = processFluxHeaderActions(resource, defaultHeaderActions(), false);

      expect(ids(result)).toEqual([
        DetailsViewDefaultHeaderActions.RESTART,
        'flux-view-yaml',
        'flux-managed-indicator',
      ]);
    }
  );

  it('keeps mutating actions and adds the indicator when allowed', () => {
    const resource = makeResource('Deployment', { [KUSTOMIZE_LABEL]: 'podinfo' });
    const result = processFluxHeaderActions(resource, defaultHeaderActions(), true);

    expect(ids(result)).toEqual([
      DetailsViewDefaultHeaderActions.RESTART,
      DetailsViewDefaultHeaderActions.SCALE,
      DetailsViewDefaultHeaderActions.EDIT,
      DetailsViewDefaultHeaderActions.DELETE,
      'rollback',
      'flux-managed-indicator',
    ]);
  });
});

describe('registerFluxHeaderActionsProcessor', () => {
  it('shows mutating actions only in clusters where they were allowed', () => {
    store.set({ allowFluxManagedActions: { qa: true } } as unknown as PluginConfig);
    registerFluxHeaderActionsProcessor();
    const labels = { [KUSTOMIZE_LABEL]: 'podinfo' };

    const qa = registered.processor!(
      makeResource('Deployment', labels, 'qa'),
      defaultHeaderActions()
    );
    const prod = registered.processor!(
      makeResource('Deployment', labels, 'prod'),
      defaultHeaderActions()
    );

    expect(ids(qa)).toContain(DetailsViewDefaultHeaderActions.EDIT);
    expect(ids(prod)).not.toContain(DetailsViewDefaultHeaderActions.EDIT);
  });
});
