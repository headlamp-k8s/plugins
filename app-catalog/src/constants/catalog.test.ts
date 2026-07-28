import { describe, expect, it } from 'vitest';
import {
  APP_CATALOG_HELM_REPOSITORY,
  ARTIFACTHUB_PROTOCOL,
  COMMUNITY_REPO,
  CUSTOM_CHART_VALUES_PREFIX,
  HELM_PROTOCOL,
  PAGE_OFFSET_COUNT_FOR_CHARTS,
  VANILLA_HELM_REPO,
} from './catalog';

describe('Catalog Constants', () => {
  it('should define repository type constants', () => {
    expect(VANILLA_HELM_REPO).toBe('VANILLA_HELM_REPOSITORY');
    expect(COMMUNITY_REPO).toBe('COMMUNITY_REPOSITORY');
  });

  it('should define protocol constants', () => {
    expect(HELM_PROTOCOL).toBe('helm');
    expect(ARTIFACTHUB_PROTOCOL).toBe('artifacthub');
  });

  it('should define custom chart values prefix', () => {
    expect(CUSTOM_CHART_VALUES_PREFIX).toBe('CUSTOM_CHART_VALUES_PREFIX');
  });

  it('should define helm repository name', () => {
    expect(APP_CATALOG_HELM_REPOSITORY).toBe('app-catalog');
  });

  it('should define pagination constant', () => {
    expect(PAGE_OFFSET_COUNT_FOR_CHARTS).toBe(12);
    // Verify it divides evenly into common grid columns (2, 3, 4, 6)
    expect(PAGE_OFFSET_COUNT_FOR_CHARTS % 2).toBe(0);
    expect(PAGE_OFFSET_COUNT_FOR_CHARTS % 3).toBe(0);
    expect(PAGE_OFFSET_COUNT_FOR_CHARTS % 4).toBe(0);
    expect(PAGE_OFFSET_COUNT_FOR_CHARTS % 6).toBe(0);
  });

  it('should use consistent constant types', () => {
    expect(typeof VANILLA_HELM_REPO).toBe('string');
    expect(typeof COMMUNITY_REPO).toBe('string');
    expect(typeof HELM_PROTOCOL).toBe('string');
    expect(typeof ARTIFACTHUB_PROTOCOL).toBe('string');
    expect(typeof PAGE_OFFSET_COUNT_FOR_CHARTS).toBe('number');
  });
});
