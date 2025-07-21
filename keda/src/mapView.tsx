import { Icon } from '@iconify/react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { useMemo } from 'react';
import { ClusterTriggerAuthenticationDetail } from './components/clustertriggerauthentication/Detail';
import { ScaledJobDetail } from './components/scaledjobs/Detail';
import { ScaledObjectDetail } from './components/scaledobjects/Detail';
import { TriggerAuthenticationDetail } from './components/triggerauthentication/Detail';
import { ClusterTriggerAuthentication } from './resources/clusterTriggerAuthentication';
import { ScaledJob } from './resources/scaledjob';
import { ScaledObject } from './resources/scaledobject';
import { TriggerAuthentication } from './resources/triggerAuthentication';

export const makeKubeToKubeEdge = (from: any, to: any): any => ({
  id: `${from.metadata.uid}-${to.metadata.uid}`,
  source: from.metadata.uid,
  target: to.metadata.uid,
});

const findAuthenticationEdges = (
  sourceObject: ScaledObject | ScaledJob,
  triggerAuthentications: TriggerAuthentication[],
  clusterTriggerAuthentications: ClusterTriggerAuthentication[]
) => {
  const edges = [];
  const { triggers } = sourceObject.spec;

  if (!triggers || !triggerAuthentications || !clusterTriggerAuthentications) {
    return edges;
  }

  triggers.forEach(trigger => {
    if (trigger.authenticationRef) {
      const authRefKind = trigger.authenticationRef.kind || TriggerAuthentication.kind;
      const authRefName = trigger.authenticationRef.name;

      let auth = null;
      if (authRefKind === TriggerAuthentication.kind) {
        auth = triggerAuthentications.find(
          auth =>
            auth.metadata.namespace === sourceObject.metadata.namespace &&
            auth.metadata.name === authRefName
        );
      } else if (authRefKind === ClusterTriggerAuthentication.kind) {
        auth = clusterTriggerAuthentications.find(auth => auth.metadata.name === authRefName);
      }

      if (auth) {
        edges.push(makeKubeToKubeEdge(sourceObject, auth));
      }
    }
  });

  return edges;
};

const triggerAuthenticationSource = {
  id: 'keda-trigger-authentications',
  label: 'triggerauthentications',
  icon: <Icon icon="mdi:shield-key" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [triggerAuthentications] = TriggerAuthentication.useList();

    return useMemo(() => {
      if (!triggerAuthentications) return null;

      const nodes = triggerAuthentications?.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        weight: 1000,
        detailsComponent: ({ node }) => (
          <TriggerAuthenticationDetail
            namespace={node.kubeObject.jsonData.metadata.namespace}
            name={node.kubeObject.jsonData.metadata.name}
          />
        ),
      }));

      return {
        nodes,
      };
    }, [triggerAuthentications]);
  },
};

const clusterTriggerAuthenticationSource = {
  id: 'keda-cluster-trigger-authentications',
  label: 'clustertriggerauthentications',
  icon: <Icon icon="mdi:shield-key" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [clusterTriggerAuthentications] = ClusterTriggerAuthentication.useList();

    return useMemo(() => {
      if (!clusterTriggerAuthentications) return null;

      const nodes = clusterTriggerAuthentications?.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        weight: 1000,
        detailsComponent: ({ node }) => (
          <ClusterTriggerAuthenticationDetail name={node.kubeObject.jsonData.metadata.name} />
        ),
      }));

      return {
        nodes,
      };
    }, [clusterTriggerAuthentications]);
  },
};

const scaledObjectSource = {
  id: 'keda-scaled-objects',
  label: 'scaledobjects',
  icon: <Icon icon="mdi:lightning-bolt" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [scaledObjects] = ScaledObject.useList();
    const [triggerAuthentications] = TriggerAuthentication.useList();
    const [clusterTriggerAuthentications] = ClusterTriggerAuthentication.useList();
    const [hpas] = K8s.ResourceClasses.HorizontalPodAutoscaler.useList();

    return useMemo(() => {
      if (!scaledObjects) return null;

      const nodes = scaledObjects?.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        weight: 2000,
        detailsComponent: ({ node }) => (
          <ScaledObjectDetail
            namespace={node.kubeObject.jsonData.metadata.namespace}
            name={node.kubeObject.jsonData.metadata.name}
          />
        ),
      }));

      const edges = [];

      scaledObjects?.forEach(scaledObject => {
        const scaledObjectNamespace = scaledObject.metadata.namespace;
        const scaledObjectName = scaledObject.metadata.name;
        const { scaleTargetRef: scaledObjectTargetRef } = scaledObject.spec;

        const authEdges = findAuthenticationEdges(
          scaledObject,
          triggerAuthentications,
          clusterTriggerAuthentications
        );
        edges.push(...authEdges);

        if (scaledObjectTargetRef && scaledObjectTargetRef.name) {
          const relatedHPA = hpas?.find(hpa => {
            const hpaNamespace = hpa.jsonData?.metadata?.namespace || hpa.metadata?.namespace;
            const hpaOwnerRefs =
              hpa.jsonData?.metadata?.ownerReferences || hpa.metadata?.ownerReferences;

            return (
              hpaNamespace === scaledObjectNamespace &&
              hpaOwnerRefs?.find(
                ownerRef =>
                  ownerRef.apiVersion === ScaledObject.apiVersion &&
                  ownerRef.kind === ScaledObject.kind &&
                  ownerRef.name === scaledObjectName
              )
            );
          });

          if (relatedHPA) {
            edges.push(makeKubeToKubeEdge(scaledObject, relatedHPA));
          }
        }
      });

      return {
        nodes,
        edges,
      };
    }, [scaledObjects, triggerAuthentications, clusterTriggerAuthentications, hpas]);
  },
};

const scaledJobSource = {
  id: 'keda-scaled-jobs',
  label: 'scaledjobs',
  icon: <Icon icon="mdi:lightning-bolt" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [scaledJobs] = ScaledJob.useList();
    const [triggerAuthentications] = TriggerAuthentication.useList();
    const [clusterTriggerAuthentications] = ClusterTriggerAuthentication.useList();
    const [jobs] = K8s.ResourceClasses.Job.useList();

    return useMemo(() => {
      if (!scaledJobs) return null;

      const nodes = scaledJobs?.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        weight: 2000,
        detailsComponent: ({ node }) => (
          <ScaledJobDetail
            namespace={node.kubeObject.jsonData.metadata.namespace}
            name={node.kubeObject.jsonData.metadata.name}
          />
        ),
      }));

      const edges = [];

      scaledJobs?.forEach(scaledJob => {
        const scaledJobNamespace = scaledJob.metadata.namespace;
        const { jobTargetRef } = scaledJob.spec;

        const authEdges = findAuthenticationEdges(
          scaledJob,
          triggerAuthentications,
          clusterTriggerAuthentications
        );
        edges.push(...authEdges);

        if (jobTargetRef && jobTargetRef.template && jobTargetRef.template.spec) {
          const relatedJobs = jobs?.filter(
            job =>
              job.metadata.namespace === scaledJobNamespace &&
              job.metadata.ownerReferences?.some(
                ownerRef =>
                  ownerRef.kind === ScaledJob.kind && ownerRef.name === scaledJob.metadata.name
              )
          );

          relatedJobs?.forEach(job => {
            edges.push(makeKubeToKubeEdge(scaledJob, job));
          });
        }
      });

      return {
        nodes,
        edges,
      };
    }, [scaledJobs, triggerAuthentications, clusterTriggerAuthentications, jobs]);
  },
};

export const kedaSource = {
  id: 'keda',
  label: 'KEDA',
  icon: <Icon icon="mdi:lightning-bolt" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  sources: [
    scaledObjectSource,
    scaledJobSource,
    triggerAuthenticationSource,
    clusterTriggerAuthenticationSource,
  ],
};
