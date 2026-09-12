vi.mock('@kinvolk/headlamp-plugin/lib/k8s/crd', () => ({
  default: {
    useGet: vi.fn(),
  },
}));

import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { getStoredVersionFromCrd, useCapiApiVersion } from './capiVersion';

describe('CAPI API version helpers', () => {
  test('prefers served storage version from CRD spec', () => {
    const crd: any = {
      jsonData: {
        spec: {
          versions: [
            { name: 'v1beta1', served: true, storage: false },
            { name: 'v1beta2', served: true, storage: true },
          ],
        },
      },
      getMainAPIGroup: () => ['cluster.x-k8s.io', 'v1alpha4'],
    };

    expect(getStoredVersionFromCrd(crd)).toBe('v1beta2');
  });

  test('falls back to served stored version and then main API group', () => {
    const storedVersionCrd: any = {
      jsonData: {
        spec: { versions: [{ name: 'v1beta1', served: true }] },
        status: { storedVersions: ['v1beta1'] },
      },
      getMainAPIGroup: () => ['cluster.x-k8s.io', 'v1alpha4'],
    };
    const fallbackCrd: any = {
      jsonData: { spec: { versions: [] } },
      getMainAPIGroup: () => ['cluster.x-k8s.io', 'v1alpha4'],
    };

    expect(getStoredVersionFromCrd(storedVersionCrd)).toBe('v1beta1');
    expect(getStoredVersionFromCrd(fallbackCrd)).toBe('v1alpha4');
    expect(getStoredVersionFromCrd(null)).toBeUndefined();
  });

  test('hook returns detected version or default fallback', () => {
    vi.mocked(CustomResourceDefinition.useGet).mockReturnValueOnce([
      {
        jsonData: { spec: { versions: [{ name: 'v1beta2', served: true, storage: true }] } },
        getMainAPIGroup: () => ['cluster.x-k8s.io', 'v1beta1'],
      },
      undefined,
    ] as any);
    expect(useCapiApiVersion('clusters.cluster.x-k8s.io', 'v1beta1')).toBe('v1beta2');

    vi.mocked(CustomResourceDefinition.useGet).mockReturnValueOnce([
      undefined,
      new Error('no crd'),
    ] as any);
    expect(useCapiApiVersion('clusters.cluster.x-k8s.io', 'v1beta1')).toBe('v1beta1');
  });
});
