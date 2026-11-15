/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 */

import { Icon } from '@iconify/react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import type { GraphSource } from '@kinvolk/headlamp-plugin/lib/components/resourceMap/graph/graphModel';
import { useMemo } from 'react';
import { buildArgoCDGraph, buildArgoCDProjectGraph } from './components/applications/resourceTree';
import { ArgoApplication } from './resources/application';
import { ArgoAppProject } from './resources/appproject';

const {
  Deployment,
  StatefulSet,
  DaemonSet,
  ReplicaSet,
  Job,
  CronJob,
  Pod,
  Service,
  ConfigMap,
  Secret,
  PersistentVolumeClaim,
  Ingress,
  NetworkPolicy,
  HorizontalPodAutoscaler,
} = K8s.ResourceClasses;
const { KubeObject } = K8s.cluster;

/** Fixed optional CRD classes. A missing CRD returns a list error and stays synthetic. */
class Certificate extends KubeObject {
  static kind = 'Certificate';
  static apiName = 'certificates';
  static apiVersion = 'cert-manager.io/v1';
  static isNamespaced = true;
}

class Rollout extends KubeObject {
  static kind = 'Rollout';
  static apiName = 'rollouts';
  static apiVersion = 'argoproj.io/v1alpha1';
  static isNamespaced = true;
}

const argoIcon = <Icon icon="simple-icons:argo" width="100%" height="100%" color="#EF7B4D" />;

export const applicationMapSource = {
  id: 'argocd-applications-map',
  label: 'Applications',
  icon: argoIcon,
  isEnabledByDefault: true,
  useData() {
    const [applications, appError] = ArgoApplication.useList();
    const [deployments, deployError] = Deployment.useList();
    const [statefulSets, stsError] = StatefulSet.useList();
    const [daemonSets, dsError] = DaemonSet.useList();
    const [replicaSets, rsError] = ReplicaSet.useList();
    const [jobs, jobError] = Job.useList();
    const [cronJobs, cronJobError] = CronJob.useList();
    const [pods, podError] = Pod.useList();
    const [services, svcError] = Service.useList();
    const [configMaps, cmError] = ConfigMap.useList();
    const [secrets, secError] = Secret.useList();
    const [pvcs, pvcError] = PersistentVolumeClaim.useList();
    const [ingresses, ingError] = Ingress.useList();
    const [networkPolicies, netPolError] = NetworkPolicy.useList();
    const [hpas, hpaError] = HorizontalPodAutoscaler.useList();
    const [certificates, certificateError] = Certificate.useList();
    const [rollouts, rolloutError] = Rollout.useList();

    const isLoading =
      (!applications && !appError) ||
      (!deployments && !deployError) ||
      (!statefulSets && !stsError) ||
      (!daemonSets && !dsError) ||
      (!replicaSets && !rsError) ||
      (!jobs && !jobError) ||
      (!cronJobs && !cronJobError) ||
      (!pods && !podError) ||
      (!services && !svcError) ||
      (!configMaps && !cmError) ||
      (!secrets && !secError) ||
      (!pvcs && !pvcError) ||
      (!ingresses && !ingError) ||
      (!networkPolicies && !netPolError) ||
      (!hpas && !hpaError) ||
      (!certificates && !certificateError) ||
      (!rollouts && !rolloutError);

    return useMemo(() => {
      if (appError) return { nodes: [], edges: [] };
      if (isLoading || !applications) return null;

      return buildArgoCDGraph(applications, [
        ...(deployments || []),
        ...(statefulSets || []),
        ...(daemonSets || []),
        ...(replicaSets || []),
        ...(jobs || []),
        ...(cronJobs || []),
        ...(pods || []),
        ...(services || []),
        ...(configMaps || []),
        ...(secrets || []),
        ...(pvcs || []),
        ...(ingresses || []),
        ...(networkPolicies || []),
        ...(hpas || []),
        ...(certificates || []),
        ...(rollouts || []),
      ]);
    }, [
      isLoading,
      appError,
      applications,
      deployments,
      statefulSets,
      daemonSets,
      replicaSets,
      jobs,
      cronJobs,
      pods,
      services,
      configMaps,
      secrets,
      pvcs,
      ingresses,
      networkPolicies,
      hpas,
      certificates,
      rollouts,
    ]);
  },
} satisfies GraphSource;

export const projectMapSource = {
  id: 'argocd-project-hierarchy-map',
  label: 'AppProject hierarchy overlay',
  icon: argoIcon,
  isEnabledByDefault: false,
  useData() {
    const [projects, projectError] = ArgoAppProject.useList();
    const [applications, applicationError] = ArgoApplication.useList();
    const isLoading = (!projects && !projectError) || (!applications && !applicationError);

    return useMemo(() => {
      if (projectError || applicationError) return { nodes: [], edges: [] };
      if (isLoading || !projects || !applications) return null;
      return buildArgoCDProjectGraph(projects, applications);
    }, [isLoading, projectError, applicationError, projects, applications]);
  },
} satisfies GraphSource;

export const argoCDSource: GraphSource = {
  id: 'argocd-resource-tree',
  label: 'Argo CD',
  icon: argoIcon,
  isEnabledByDefault: true,
  sources: [applicationMapSource, projectMapSource],
};
