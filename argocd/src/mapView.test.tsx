/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 */

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { mockApplicationUseList, mockProjectUseList, mockKubeUseList } = vi.hoisted(() => ({
  mockApplicationUseList: vi.fn(),
  mockProjectUseList: vi.fn(),
  mockKubeUseList: vi.fn(),
}));

vi.mock('@iconify/react', () => ({
  Icon: () => null,
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => {
  class KubeObject {
    static useList = mockKubeUseList;
  }
  const resourceClass = { useList: mockKubeUseList };

  return {
    K8s: {
      cluster: { KubeObject },
      ResourceClasses: {
        Deployment: resourceClass,
        StatefulSet: resourceClass,
        DaemonSet: resourceClass,
        ReplicaSet: resourceClass,
        Job: resourceClass,
        CronJob: resourceClass,
        Pod: resourceClass,
        Service: resourceClass,
        ConfigMap: resourceClass,
        Secret: resourceClass,
        PersistentVolumeClaim: resourceClass,
        Ingress: resourceClass,
        NetworkPolicy: resourceClass,
        HorizontalPodAutoscaler: resourceClass,
      },
    },
  };
});

vi.mock('./resources/application', () => ({
  ArgoApplication: { useList: mockApplicationUseList },
}));

vi.mock('./resources/appproject', () => ({
  ArgoAppProject: { useList: mockProjectUseList },
}));

vi.mock('./components/applications/resourceTree', () => ({
  buildArgoCDGraph: vi.fn(),
  buildArgoCDProjectGraph: vi.fn(),
}));

import { applicationMapSource, projectMapSource } from './mapView';

describe('Argo CD Map source loading', () => {
  beforeEach(() => {
    mockApplicationUseList.mockReset();
    mockProjectUseList.mockReset();
    mockKubeUseList.mockReset();
    mockApplicationUseList.mockReturnValue([[], undefined]);
    mockProjectUseList.mockReturnValue([[], undefined]);
    mockKubeUseList.mockReturnValue([[], undefined]);
  });

  it('returns an empty Application graph when the Application CRD cannot be listed', () => {
    mockApplicationUseList.mockReturnValue([undefined, new Error('Application CRD missing')]);

    const { result } = renderHook(() => applicationMapSource.useData());

    expect(result.current).toEqual({ nodes: [], edges: [] });
  });

  it('returns an empty hierarchy when the AppProject CRD cannot be listed', () => {
    mockProjectUseList.mockReturnValue([undefined, new Error('AppProject CRD missing')]);

    const { result } = renderHook(() => projectMapSource.useData());

    expect(result.current).toEqual({ nodes: [], edges: [] });
  });

  it('returns an empty hierarchy when the Application CRD cannot be listed', () => {
    mockApplicationUseList.mockReturnValue([undefined, new Error('Application CRD missing')]);

    const { result } = renderHook(() => projectMapSource.useData());

    expect(result.current).toEqual({ nodes: [], edges: [] });
  });

  it('labels the optional source as an overlay and keeps it disabled by default', () => {
    expect(projectMapSource.label).toBe('AppProject hierarchy overlay');
    expect(projectMapSource.isEnabledByDefault).toBe(false);
  });
});
