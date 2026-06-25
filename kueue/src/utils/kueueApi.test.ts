import { describe, expect, it } from 'vitest';
import { kueueApiGroup, kueueApiVersions } from './kueueApi';
import { kueueRoutePaths } from './kueueRoutes';

describe('Kueue API constants', () => {
  it('uses the Kueue API group with current and previous ResourceFlavor versions', () => {
    expect(kueueApiGroup).toBe('kueue.x-k8s.io');
    expect(kueueApiVersions).toEqual(['kueue.x-k8s.io/v1beta2', 'kueue.x-k8s.io/v1beta1']);
  });

  it('defines ResourceFlavor list and detail routes', () => {
    expect(kueueRoutePaths.resourceFlavorsList).toBe('/kueue/resourceflavors');
    expect(kueueRoutePaths.resourceFlavorDetail).toBe('/kueue/resourceflavors/:name');
  });
});
