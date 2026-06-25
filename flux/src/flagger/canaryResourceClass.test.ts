import { getCanaryResourceClass } from './canaryResourceClass';

test('returns undefined while the canary is still loading', () => {
  expect(getCanaryResourceClass(null)).toBeUndefined();
});

test('returns undefined when the canary is an error without makeCRClass', () => {
  expect(getCanaryResourceClass({ message: 'not found' })).toBeUndefined();
});

test('returns the resource class for a loaded canary', () => {
  class FakeCanaryClass {}
  expect(getCanaryResourceClass({ makeCRClass: () => FakeCanaryClass })).toBe(FakeCanaryClass);
});
