import { describe, expect, it } from 'vitest';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import { renderNodeLabels, renderTaints, renderTolerations } from './resourceFlavorFormatters';

describe('ResourceFlavor formatters', () => {
  it('formats node labels', () => {
    expect(renderNodeLabels({})).toBe('-');
    expect(renderNodeLabels({ 'kubernetes.io/arch': 'amd64' })).toBe('kubernetes.io/arch=amd64');
    expect(
      renderNodeLabels({ 'kubernetes.io/arch': 'amd64', 'cloud.provider/spot': 'true' })
    ).toBe('kubernetes.io/arch=amd64, cloud.provider/spot=true');
  });

  it('formats node taints', () => {
    expect(renderTaints([])).toBe('-');
    expect(renderTaints([{ key: 'spot', effect: 'NoSchedule' }])).toBe('spot:NoSchedule');
    expect(renderTaints([{ key: 'spot', value: 'true', effect: 'NoSchedule' }])).toBe(
      'spot=true:NoSchedule'
    );
    expect(
      renderTaints([
        { key: 'spot', effect: 'NoSchedule' },
        { key: 'gpu', value: 'nvidia', effect: 'NoExecute' },
      ])
    ).toBe('spot:NoSchedule, gpu=nvidia:NoExecute');
  });

  it('formats tolerations, including an empty/omitted key as a wildcard', () => {
    expect(renderTolerations([])).toBe('-');
    expect(renderTolerations([{ operator: 'Exists' }])).toBe('*');
    expect(renderTolerations([{ key: 'spot', operator: 'Exists' }])).toBe('spot');
    expect(
      renderTolerations([{ key: 'spot', operator: 'Equal', value: 'true', effect: 'NoSchedule' }])
    ).toBe('spot=true:NoSchedule');
  });

  it('renders tolerationSeconds while preserving an explicit zero', () => {
    expect(
      renderTolerations([
        { key: 'spot', operator: 'Equal', value: 'true', effect: 'NoExecute', tolerationSeconds: 0 },
      ])
    ).toBe('spot=true:NoExecute (0s)');
    expect(
      renderTolerations([
        {
          key: 'spot',
          operator: 'Equal',
          value: 'true',
          effect: 'NoExecute',
          tolerationSeconds: 300,
        },
      ])
    ).toBe('spot=true:NoExecute (300s)');
  });

  it('ignores value when operator is Exists, even if a value is also set', () => {
    // Not a valid Kubernetes manifest (Exists ignores value), but the API doesn't
    // reject it, so the display behavior should still be well-defined and tested.
    expect(
      renderTolerations([{ key: 'spot', operator: 'Exists', value: 'true', effect: 'NoSchedule' }])
    ).toBe('spot:NoSchedule');
  });

  it('builds the resource flavor detail route path', () => {
    expect(kueueRoutePaths.resourceFlavorDetail).toBe('/kueue/resourceflavors/:name');
  });
});