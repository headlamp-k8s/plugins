/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Icon } from '@iconify/react';
import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useMemo } from 'react';
import { ClusterDomainClaim, KnativeDomainMapping, KRevision, KService } from './resources/knative';

export const makeKubeToKubeEdge = (from: any, to: any): any => ({
  id: `${from.metadata.uid}-${to.metadata.uid}`,
  source: from.metadata.uid,
  target: to.metadata.uid,
});

const KServiceDetails = ({ node }: { node: any }) => (
  <DetailsGrid
    resourceType={KService}
    name={node.kubeObject.jsonData.metadata.name}
    namespace={node.kubeObject.jsonData.metadata.namespace}
    withEvents
    extraInfo={item =>
      item
        ? [
            {
              name: 'Ready',
              value: item.isReady ? 'True' : 'False',
            },
            {
              name: 'URL',
              value: item.url || '-',
            },
            {
              name: 'Latest Created',
              value: item.status?.latestCreatedRevisionName || '-',
            },
            {
              name: 'Latest Ready',
              value: item.status?.latestReadyRevisionName || '-',
            },
          ]
        : null
    }
  />
);

const RevisionDetails = ({ node }: { node: any }) => (
  <DetailsGrid
    resourceType={KRevision}
    name={node.kubeObject.jsonData.metadata.name}
    namespace={node.kubeObject.jsonData.metadata.namespace}
    withEvents
    extraInfo={item =>
      item
        ? [
            {
              name: 'Ready',
              value: item.isReady ? 'True' : 'False',
            },
            {
              name: 'Parent Service',
              value: item.parentService || '-',
            },
            {
              name: 'Image',
              value: item.primaryImage || '-',
            },
            {
              name: 'Container Concurrency',
              value: item.spec?.containerConcurrency ?? 'Default',
            },
            {
              name: 'Traffic',
              value: node.traffic?.length
                ? node.traffic
                    .map((t: any) => `${t.percent || 0}%${t.tag ? ` (${t.tag})` : ''}`)
                    .join(', ')
                : '0%',
            },
          ]
        : null
    }
  />
);

const DomainMappingDetails = ({ node }: { node: any }) => (
  <DetailsGrid
    resourceType={KnativeDomainMapping}
    name={node.kubeObject.jsonData.metadata.name}
    namespace={node.kubeObject.jsonData.metadata.namespace}
    withEvents
    extraInfo={item =>
      item
        ? [
            {
              name: 'Host',
              value: item.host || '-',
            },
            {
              name: 'Target',
              value: item.spec?.ref?.name || '-',
            },
            {
              name: 'Target Kind',
              value: item.spec?.ref?.kind || '-',
            },
            {
              name: 'URL',
              value: item.readyUrl || '-',
            },
          ]
        : null
    }
  />
);

const ClusterDomainClaimDetails = ({ node }: { node: any }) => (
  <DetailsGrid
    resourceType={ClusterDomainClaim}
    name={node.kubeObject.jsonData.metadata.name}
    withEvents
    extraInfo={item =>
      item
        ? [
            {
              name: 'Domain',
              value: item.metadata?.name || '-',
            },
            {
              name: 'Owner Namespace',
              value: item.targetNamespace || '-',
            },
          ]
        : null
    }
  />
);

const knativeServiceSource: any = {
  id: 'knative-service',
  label: 'KService',
  icon: <Icon icon="custom:knative" width="100%" height="100%" color="rgb(7, 102, 174)" />,
  useData() {
    const [kservices] = KService.useList();

    return useMemo(() => {
      if (!kservices) return null;

      const nodes = kservices.map(kservice => ({
        id: kservice.metadata.uid,
        kubeObject: kservice,
        detailsComponent: KServiceDetails,
        weight: 1100,
      }));

      const edges: any[] = [];
      return {
        nodes,
        edges,
      };
    }, [kservices]);
  },
};

const knativeRevisionSource: any = {
  id: 'knative-revision',
  label: 'Revision',
  icon: <Icon icon="custom:knative" width="100%" height="100%" color="rgb(7, 102, 174)" />,
  useData() {
    const [kservices] = KService.useList();
    const [revisions] = KRevision.useList();

    return useMemo(() => {
      if (!revisions) return null;
      const kserviceMap = new Map<string, KService>();
      if (kservices) {
        kservices.forEach(svc => {
          kserviceMap.set(`${svc.metadata.namespace}/${svc.metadata.name}`, svc);
        });
      }

      const edges: any[] = [];

      const nodes = revisions.map(rev => {
        let traffic: any[] = [];
        const parentSvc = kserviceMap.get(`${rev.metadata.namespace}/${rev.parentService}`);

        if (parentSvc) {
          traffic = rev.getTrafficInService(parentSvc);
          edges.push(makeKubeToKubeEdge(parentSvc, rev));
        }

        return {
          id: rev.metadata.uid,
          kubeObject: rev,
          detailsComponent: RevisionDetails,
          weight: 1100,
          traffic,
        };
      });

      return {
        nodes,
        edges,
      };
    }, [kservices, revisions]);
  },
};

const knativeDomainMappingSource: any = {
  id: 'knative-domain-mapping',
  label: 'Domain Mapping',
  icon: <Icon icon="custom:knative" width="100%" height="100%" color="rgb(7, 102, 174)" />,
  useData() {
    const [kservices] = KService.useList();
    const [domainMappings] = KnativeDomainMapping.useList();

    return useMemo(() => {
      if (!domainMappings) return null;

      const kserviceMap = new Map<string, KService>();
      if (kservices) {
        kservices.forEach(svc => {
          kserviceMap.set(`${svc.metadata.namespace}/${svc.metadata.name}`, svc);
        });
      }

      const edges: any[] = [];

      const nodes = domainMappings.map(dm => {
        const ref = dm.spec?.ref;
        const refApiVersion = ref?.apiVersion;
        const refNamespace = ref?.namespace || dm.metadata.namespace;

        const isKnativeServingService =
          ref?.kind === 'Service' && refApiVersion?.startsWith('serving.knative.dev/');

        if (isKnativeServingService) {
          const parentSvc = kserviceMap.get(`${refNamespace}/${ref.name}`);
          if (parentSvc) {
            edges.push(makeKubeToKubeEdge(dm, parentSvc));
          }
        }

        return {
          id: dm.metadata.uid,
          kubeObject: dm,
          detailsComponent: DomainMappingDetails,
          weight: 1100,
        };
      });

      return {
        nodes,
        edges,
      };
    }, [kservices, domainMappings]);
  },
};

const knativeClusterDomainClaimSource: any = {
  id: 'knative-cluster-domain-claim',
  label: 'Cluster Domain Claim',
  icon: <Icon icon="custom:knative" width="100%" height="100%" color="rgb(7, 102, 174)" />,
  useData() {
    const [clusterDomainClaims] = ClusterDomainClaim.useList();

    return useMemo(() => {
      if (!clusterDomainClaims) return null;

      const nodes = clusterDomainClaims.map(cdc => ({
        id: cdc.metadata.uid,
        kubeObject: cdc,
        detailsComponent: ClusterDomainClaimDetails,
        weight: 1100,
      }));

      return {
        nodes,
        edges: [],
      };
    }, [clusterDomainClaims]);
  },
};

export const knativePluginSource = {
  id: 'knative',
  label: 'Knative',
  icon: <Icon icon="custom:knative" width="100%" height="100%" color="rgb(7, 102, 174)" />,
  sources: [
    knativeServiceSource,
    knativeRevisionSource,
    knativeDomainMappingSource,
    knativeClusterDomainClaimSource,
  ],
};
