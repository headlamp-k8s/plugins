import { describe, expect, it } from 'vitest';
import { mongoRouteNames, mongoRoutePaths } from './routes';

describe('MongoDB Routes', () => {
  it('defines the Community list route path and name correctly', () => {
    expect(mongoRoutePaths.communityList).toBe('/mongodb/community');
    expect(mongoRouteNames.communityList).toBe('mongodb-community-list');
  });

  it('defines the Community detail route path and name correctly', () => {
    expect(mongoRoutePaths.communityDetail).toBe('/mongodb/community/:namespace/:name');
    expect(mongoRouteNames.communityDetail).toBe('mongodb-community-detail');
  });
});
