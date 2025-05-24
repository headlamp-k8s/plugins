import { useMemo } from 'react';
import { Icon } from '@iconify/react';
import { ScaledObject } from "./resources/scaledobject";
import { ScaledObjectDetail } from './components/scaledobjects/Detail';
// import HPA from '@kinvolk/headlamp-plugin/lib/K8s/hpa';
import Deployment from '@kinvolk/headlamp-plugin/lib/K8s/deployment';
import StatefulSet from '@kinvolk/headlamp-plugin/lib/K8s/statefulSet';
import { ScaledJob } from "./resources/scaledjob";
import { ScaledJobDetail } from './components/scaledjobs/Detail';
import Job from '@kinvolk/headlamp-plugin/lib/K8s/job';
import { TriggerAuthentication } from "./resources/triggerAuthentication";
import { TriggerAuthenticationDetail } from './components/triggerauthentication/Detail';
import { ClusterTriggerAuthentication } from './resources/clusterTriggerAuthentication';
import { ClusterTriggerAuthenticationDetail } from './components/clustertriggerauthentication/Detail';

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
  };

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
        auth = clusterTriggerAuthentications.find(
          auth => auth.metadata.name === authRefName
        )
      }

      if (auth) {
        edges.push(makeKubeToKubeEdge(sourceObject, auth));
      }
    }
  });

  return edges;
}

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
        detailsComponent: ({ node }) => (
          <TriggerAuthenticationDetail
            namespace={node.kubeObject.jsonData.metadata.namespace}
            name={node.kubeObject.jsonData.metadata.name}
          />
        ),
      }))

      return {
        nodes,
      }
    }, [triggerAuthentications])
  }
}

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
        detailsComponent: ({ node }) => (
          <ClusterTriggerAuthenticationDetail
            name={node.kubeObject.jsonData.metadata.name}
          />
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
        // const [hpas] = HPA.useList();
        const [deployments] = Deployment.useList();
        const [statefulSets] = StatefulSet.useList();
        
        return useMemo(() => {
          if (!scaledObjects) return null;
          
          const nodes = scaledObjects?.map(it => ({
            id: it.metadata.uid,
            kubeObject: it,
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
            // const scaledObjectName = scaledObject.metadata.name;
            const { scaleTargetRef } = scaledObject.spec;

            const authEdges = findAuthenticationEdges(
              scaledObject,
              triggerAuthentications,
              clusterTriggerAuthentications
            );
            edges.push(...authEdges);

            if (scaleTargetRef && scaleTargetRef.name) {
              const targetResouceKind = scaleTargetRef.kind || Deployment.kind;
              const targetResourceName = scaleTargetRef.name;
  
              // const relatedHPA = hpas?.find(
              //     hpa =>
              //         hpa.metadata.namespace === scaledObjectNamespace &&
              //         hpa.metadata.ownerReferences?.some(
              //             ownerRef => ownerRef.kind === ScaledObject.kind &&
              //             ownerRef.name === scaledObjectName
              //         )
              // );
              
              let targetResource = null;
              if (targetResouceKind === Deployment.kind && deployments) {
                targetResource = deployments.find(
                  deployment =>
                    deployment.metadata.namespace === scaledObjectNamespace &&
                    deployment.metadata.name === targetResourceName
                );
              } else if (targetResouceKind === StatefulSet.kind && statefulSets) {
                targetResource = statefulSets.find(
                  statefulSet =>
                    statefulSet.metadata.namespace === scaledObjectNamespace &&
                    statefulSet.metadata.name === targetResourceName
                );
              }
              
              // if (relatedHPA) {
              //     edges.push(makeKubeToKubeEdge(scaledObject, relatedHPA));
  
              //     if (targetResource) {
              //         edges.push(makeKubeToKubeEdge(relatedHPA, targetResource));
              //     }
              // } else if (targetResource) {
              //   edges.push(makeKubeToKubeEdge(scaledObject, targetResource));
              // }
  
              if(targetResource) {
                  edges.push(makeKubeToKubeEdge(scaledObject, targetResource))
              }
            }
          });
          
          return {
            nodes,
            edges,
          };
        }, [scaledObjects, triggerAuthentications, clusterTriggerAuthentications, deployments, statefulSets]);
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
      const [jobs] = Job.useList();

      return useMemo(() => {
        if (!scaledJobs) return null;
        
        const nodes = scaledJobs?.map(it => ({
          id: it.metadata.uid,
          kubeObject: it,
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
          )
          edges.push(...authEdges)

          if (jobTargetRef &&
              jobTargetRef.template &&
              jobTargetRef.template.spec
          ) {
            const relatedJobs = jobs?.filter(
              job =>
                job.metadata.namespace === scaledJobNamespace &&
                job.metadata.ownerReferences?.some(
                  ownerRef => 
                    ownerRef.kind === ScaledJob.kind &&
                    ownerRef.name === scaledJob.metadata.name                    
                )
            )
  
            relatedJobs?.forEach(job => {
              edges.push(makeKubeToKubeEdge(scaledJob, job));
            });
          };
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
    sources: [scaledObjectSource, scaledJobSource, triggerAuthenticationSource, clusterTriggerAuthenticationSource],
};