import { Icon } from '@iconify/react';
import Deployment from '@kinvolk/headlamp-plugin/lib/K8s/deployment';
import { useMemo } from 'react';
import { HelmRelease, HelmRepository, Kustomization, OCIRepository } from './common/Resources';
import { FluxHelmReleaseDetailView } from './helm-releases/HelmReleaseSingle';
import { FluxKustomizationDetailView } from './kustomizations/KustomizationSingle';
import { FluxSourceDetailView } from './sources/SourceSingle';

export const makeKubeToKubeEdge = (from: any, to: any): any => ({
  id: `${from.metadata.uid}-${to.metadata.uid}`,
  source: from.metadata.uid,
  target: to.metadata.uid,
});

const HelmReleaseDetails = ({ node }) => (
  <FluxHelmReleaseDetailView
    name={node.kubeObject.jsonData.metadata.name}
    namespace={node.kubeObject.jsonData.metadata.namespace}
  />
);
const HelmRepositoryDetails = ({ node }) => (
  <FluxSourceDetailView
    pluralName="helmrepositories"
    name={node.kubeObject.jsonData.metadata.name}
    namespace={node.kubeObject.jsonData.metadata.namespace}
  />
);
const KustomizationDetails = ({ node }) => (
  <FluxKustomizationDetailView
    name={node.kubeObject.jsonData.metadata.name}
    namespace={node.kubeObject.jsonData.metadata.namespace}
  />
);
const OCIRepositoryDetails = ({ node }) => (
  <FluxSourceDetailView
    pluralName="ocirepositories"
    name={node.kubeObject.jsonData.metadata.name}
    namespace={node.kubeObject.jsonData.metadata.namespace}
  />
);

const helmRepositorySource: any = {
  id: 'flux-helm-repository',
  label: 'Helm Repository',
  icon: <Icon icon="simple-icons:flux" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [repositories] = HelmRepository.useList();
    const [releases] = HelmRelease.useList();

    return useMemo(() => {
      if (!repositories || !releases) return null;

      const nodes = repositories?.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        detailsComponent: HelmRepositoryDetails,
        weight: 1100,
      }));
      const edges: any[] = [];

      repositories?.forEach(repo => {
        const { name } = repo.metadata;

        const release = releases?.find(
          it =>
            it.jsonData.spec?.chart?.spec?.sourceRef?.kind === 'HelmRepository' &&
            it.jsonData.spec?.chart?.spec?.sourceRef?.name === name
        );

        if (release) {
          edges.push(makeKubeToKubeEdge(release, repo));
        }
      });

      return {
        nodes,
        edges,
      };
    }, [repositories, releases]);
  },
};

const helmReleaseSource = {
  id: 'flux-helm-releases',
  label: 'Helm Release',
  icon: <Icon icon="simple-icons:flux" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [deployments] = Deployment.useList();
    const [releases] = HelmRelease.useList();

    return useMemo(() => {
      if (!deployments || !releases) return null;
      const nodes = releases?.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        detailsComponent: HelmReleaseDetails,
        weight: 1050,
      }));
      const edges = [];

      releases?.forEach(release => {
        const { name, namespace } = release.metadata;

        const deployment = deployments?.find(
          it =>
            it.metadata.labels?.['helm.toolkit.fluxcd.io/name'] === name &&
            it.metadata.labels?.['helm.toolkit.fluxcd.io/namespace'] === namespace
        );

        if (deployment) {
          edges.push(makeKubeToKubeEdge(release, deployment));
        }
      });

      return {
        nodes,
        edges,
      };
    }, [deployments, releases]);
  },
};

const kustomizationSource = {
  id: 'flux-kustomization',
  label: 'Kustomizations',
  icon: <Icon icon="simple-icons:flux" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [deployments] = Deployment.useList();
    const [kustomizations] = Kustomization.useList();

    return useMemo(() => {
      if (!deployments || !kustomizations) return null;
      const nodes = kustomizations?.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        detailsComponent: KustomizationDetails,
        weight: 1050,
      }));
      const edges = [];

      kustomizations?.forEach(release => {
        const { name, namespace } = release.metadata;

        deployments
          ?.filter(
            it =>
              it.metadata.labels?.['kustomize.toolkit.fluxcd.io/name'] === name &&
              it.metadata.labels?.['kustomize.toolkit.fluxcd.io/namespace'] === namespace
          )
          .forEach(deployment => {
            edges.push(makeKubeToKubeEdge(release, deployment));
          });
      });

      return {
        nodes,
        edges,
      };
    }, [deployments, kustomizations]);
  },
};

const ociSource = {
  id: 'flex-oci-source',
  label: 'OCI Source',
  icon: <Icon icon="simple-icons:flux" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [kustomizations] = Kustomization.useList();
    const [ocisources] = OCIRepository.useList();

    return useMemo(() => {
      if (!kustomizations || !ocisources) return null;
      const nodes = ocisources?.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        detailsComponent: OCIRepositoryDetails,
        weight: 1100,
      }));
      const edges = [];

      ocisources?.forEach(release => {
        const { name } = release.metadata;

        kustomizations
          ?.filter(
            it =>
              it.jsonData.spec?.sourceRef?.kind === 'OCIRepository' &&
              it.jsonData.spec?.sourceRef?.name === name
          )
          .forEach(deployment => {
            edges.push(makeKubeToKubeEdge(release, deployment));
          });
      });

      return {
        nodes,
        edges,
      };
    }, [kustomizations, ocisources]);
  },
};

export const fluxSource = {
  id: 'flux',
  label: 'Flux',
  icon: <Icon icon="simple-icons:flux" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  sources: [helmReleaseSource, helmRepositorySource, kustomizationSource, ociSource],
};
