/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, it } from 'vitest';
import { getGeneratedApplications } from './Detail';

describe('ApplicationSetDetail generated Application resolution', () => {
  it('only returns Applications with the matching owner UID', () => {
    const applicationSet = {
      cluster: 'cluster-a',
      metadata: { namespace: 'argocd', uid: 'application-set-uid' },
    } as any;
    const matching = {
      cluster: 'cluster-a',
      metadata: {
        namespace: 'argocd',
        ownerReferences: [
          {
            apiVersion: 'argoproj.io/v1alpha1',
            kind: 'ApplicationSet',
            uid: 'application-set-uid',
          },
        ],
      },
    };
    const namedButUnowned = {
      cluster: 'cluster-a',
      metadata: {
        namespace: 'argocd',
        labels: { 'app.kubernetes.io/instance': 'application-set' },
      },
    };

    expect(
      getGeneratedApplications([matching, matching, namedButUnowned] as any, applicationSet)
    ).toEqual([matching]);
  });
});
