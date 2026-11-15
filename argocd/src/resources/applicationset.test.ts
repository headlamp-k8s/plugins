/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, it } from 'vitest';
import {
  ArgoApplicationSet,
  getApplicationSetHealthStatus,
  getGeneratedApplicationCount,
  getGeneratorSummary,
  isGeneratedApplication,
  safeRepositoryIdentifier,
} from './applicationset';

describe('ApplicationSet helpers', () => {
  it.each([
    [{ list: { elements: [{ cluster: 'prod' }] } }, 'List'],
    [{ clusters: {} }, 'Clusters'],
    [{ scmProvider: { gitlab: { tokenRef: { secretName: 'hidden' } } } }, 'SCM Provider'],
    [{ pullRequest: { github: { tokenRef: { secretName: 'hidden' } } } }, 'Pull Request'],
    [{ clusterDecisionResource: { configMapRef: 'placement' } }, 'Cluster Decision Resource'],
  ])('summarises supported generator %j safely', (generator, expected) => {
    expect(getGeneratorSummary(generator)).toBe(expected);
    expect(getGeneratorSummary(generator)).not.toContain('hidden');
  });

  it('summarises nested generators without exposing credentials or plugin input', () => {
    expect(
      getGeneratorSummary({
        matrix: {
          generators: [
            { git: { repoURL: 'https://example.test/repo', directories: [{}] } },
            { clusters: {} },
          ],
        },
      })
    ).toBe('Matrix (Git · https://example.test/repo · 1 path + Clusters)');
    expect(
      getGeneratorSummary({
        plugin: {
          configMapRef: { name: 'generator-plugin', tokenRef: { secretName: 'hidden' } },
          input: { token: 'secret' },
        },
      })
    ).toBe('Plugin · generator-plugin');
    expect(
      getGeneratorSummary({ merge: { generators: [{ list: {} }, { pullRequest: {} }] } })
    ).toBe('Merge (List + Pull Request)');
    expect(getGeneratorSummary({ future: { password: 'secret' } })).toBe('Unknown generator');
  });

  it('redacts credentials, query parameters, and fragments from Git repository URLs', () => {
    const summary = getGeneratorSummary({
      git: {
        repoURL: 'https://user:token@example.test/org/repo?access_token=hidden#private',
        files: [{}],
      },
    });

    expect(summary).toBe('Git · https://example.test/org/repo · 1 path');
    expect(summary).not.toMatch(/user|token|hidden|private/);
  });

  it('redacts credentials from malformed and SCP-style repository URLs', () => {
    expect(safeRepositoryIdentifier('https://user:token@bad host/repo?secret=hidden')).toBe(
      'https://bad host/repo'
    );
    expect(safeRepositoryIdentifier('git@github.example:team/repo.git#private')).toBe(
      'github.example:team/repo.git'
    );
  });

  it('normalizes single-source, multi-source, and templated destination data', () => {
    const single = new ArgoApplicationSet({
      apiVersion: 'argoproj.io/v1alpha1',
      kind: 'ApplicationSet',
      metadata: { name: 'single', namespace: 'argocd' },
      spec: {
        template: {
          spec: {
            project: '{{project}}',
            source: { repoURL: 'https://example.test/repo', targetRevision: '{{revision}}' },
            destination: { name: '{{cluster}}', namespace: '{{namespace}}' },
          },
        },
      },
    } as any);
    const multiple = new ArgoApplicationSet({
      apiVersion: 'argoproj.io/v1alpha1',
      kind: 'ApplicationSet',
      metadata: { name: 'multiple', namespace: 'argocd' },
      spec: {
        template: {
          spec: {
            sources: [
              { repoURL: 'https://example.test/one' },
              { repoURL: 'https://example.test/two' },
            ],
          },
        },
      },
    } as any);

    expect(single.templateSources).toHaveLength(1);
    expect(single.templateProject).toBe('{{project}}');
    expect(single.templateDestination).toEqual({ name: '{{cluster}}', namespace: '{{namespace}}' });
    expect(multiple.templateSources).toHaveLength(2);
  });

  it('uses the documented ApplicationSet health priority', () => {
    expect(getApplicationSetHealthStatus({ health: { status: 'Healthy' } })).toBe('Healthy');
    expect(
      getApplicationSetHealthStatus({
        conditions: [
          { type: 'ResourcesUpToDate', status: 'True' },
          { type: 'ErrorOccurred', status: 'True' },
        ],
      })
    ).toBe('Degraded');
    expect(
      getApplicationSetHealthStatus({
        conditions: [{ type: 'RolloutProgressing', status: 'True' }],
      })
    ).toBe('Progressing');
    expect(getApplicationSetHealthStatus()).toBe('Unknown');
  });

  it('uses count precedence and keeps an unknown count unknown', () => {
    expect(getGeneratedApplicationCount({ resourcesCount: 5, resources: [{}, {}] }, 1)).toBe(5);
    expect(getGeneratedApplicationCount({ resources: [{}, {}] }, 1)).toBe(2);
    expect(getGeneratedApplicationCount(undefined, 1)).toBe(1);
    expect(getGeneratedApplicationCount()).toBeUndefined();
  });

  it('matches generated Applications only by same-cluster namespace and owner UID', () => {
    const applicationSet = {
      cluster: 'cluster-a',
      metadata: { namespace: 'argocd', uid: 'set-uid' },
    };
    const app = {
      cluster: 'cluster-a',
      metadata: {
        namespace: 'argocd',
        ownerReferences: [
          { apiVersion: 'argoproj.io/v1alpha1', kind: 'ApplicationSet', uid: 'set-uid' },
        ],
      },
    };
    expect(isGeneratedApplication(app, applicationSet)).toBe(true);
    expect(
      isGeneratedApplication(
        {
          ...app,
          metadata: {
            ...app.metadata,
            ownerReferences: [
              { apiVersion: 'argoproj.io/v1beta1', kind: 'ApplicationSet', uid: 'set-uid' },
            ],
          },
        },
        applicationSet
      )
    ).toBe(true);
    expect(isGeneratedApplication({ ...app, cluster: 'cluster-b' }, applicationSet)).toBe(false);
    expect(
      isGeneratedApplication(
        { ...app, metadata: { ...app.metadata, namespace: 'other' } },
        applicationSet
      )
    ).toBe(false);
    expect(
      isGeneratedApplication(
        {
          ...app,
          metadata: {
            ...app.metadata,
            ownerReferences: [
              { apiVersion: 'argoproj.io/v1alpha1', kind: 'ApplicationSet', uid: 'other' },
            ],
          },
        },
        applicationSet
      )
    ).toBe(false);
    expect(
      isGeneratedApplication(
        {
          ...app,
          metadata: {
            ...app.metadata,
            ownerReferences: [
              { apiVersion: 'other.io/v1alpha1', kind: 'ApplicationSet', uid: 'set-uid' },
              { apiVersion: 'argoproj.io/v1alpha1', kind: 'Application', uid: 'set-uid' },
            ],
          },
        },
        applicationSet
      )
    ).toBe(false);
  });
});
