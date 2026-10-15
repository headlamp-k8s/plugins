import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useCollectedSubResources } from './useCollectedSubResources';

function makeItem(uid: string, resourceVersion = '1'): any {
  return { kind: 'ConfigMap', metadata: { uid, name: uid, resourceVersion } };
}

describe('useCollectedSubResources', () => {
  it('collects items and errors per kind', () => {
    const { result } = renderHook(() => useCollectedSubResources());
    act(() => {
      result.current.onItems('v1:ConfigMap', [makeItem('cm-1')], null);
      result.current.onItems('apps/v1:Deployment', [], { kind: 'Deployment', message: 'denied' });
    });
    expect(result.current.items.map(item => item.metadata.uid)).toEqual(['cm-1']);
    expect(result.current.errors).toEqual([{ kind: 'Deployment', message: 'denied' }]);
  });

  it('drops a kind that reports no items and no error', () => {
    // A collector for a kind removed from the RGD's templates unmounts
    // and never reports again; the collectors component reports an
    // empty result on its behalf so its last items are not retained.
    const { result } = renderHook(() => useCollectedSubResources());
    act(() => {
      result.current.onItems('v1:ConfigMap', [makeItem('cm-1')], null);
      result.current.onItems('v1:Secret', [makeItem('secret-1')], {
        kind: 'Secret',
        message: 'denied',
      });
    });
    expect(result.current.items).toHaveLength(2);
    expect(result.current.errors).toHaveLength(1);

    act(() => {
      result.current.onItems('v1:Secret', [], null);
    });
    expect(result.current.items.map(item => item.metadata.uid)).toEqual(['cm-1']);
    expect(result.current.errors).toEqual([]);
  });

  it('lists an object once when two kinds report the same uid', () => {
    // Two served versions of one custom kind resolve to the same class,
    // so both collectors report the same objects.
    const { result } = renderHook(() => useCollectedSubResources());
    act(() => {
      result.current.onItems('ai.example.com/v1alpha1:Model', [makeItem('model-1')], null);
      result.current.onItems('ai.example.com/v1beta1:Model', [makeItem('model-1')], null);
    });
    expect(result.current.items.map(item => item.metadata.uid)).toEqual(['model-1']);
  });

  it('ignores reports whose uid/resourceVersion signature is unchanged', () => {
    const { result } = renderHook(() => useCollectedSubResources());
    act(() => {
      result.current.onItems('v1:ConfigMap', [makeItem('cm-1', '7')], null);
    });
    const firstItems = result.current.items;
    act(() => {
      result.current.onItems('v1:ConfigMap', [makeItem('cm-1', '7')], null);
    });
    expect(result.current.items).toBe(firstItems);
    act(() => {
      result.current.onItems('v1:ConfigMap', [makeItem('cm-1', '8')], null);
    });
    expect(result.current.items).not.toBe(firstItems);
  });
});
