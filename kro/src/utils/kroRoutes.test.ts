import { describe, expect, it } from 'vitest';
import { kroRouteNames, kroRoutePaths } from './kroRoutes';

describe('kroRoutes', () => {
  it('defines a detail path parameterized by name only (RGDs are cluster-scoped)', () => {
    expect(kroRoutePaths.resourceGraphDefinitionDetail).toBe('/kro/resourcegraphdefinitions/:name');
    expect(kroRoutePaths.resourceGraphDefinitionDetail).not.toContain(':namespace');
  });

  it('has a route name for every route path', () => {
    expect(Object.keys(kroRouteNames).sort()).toEqual(Object.keys(kroRoutePaths).sort());
  });
});
