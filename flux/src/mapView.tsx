import { Icon } from '@iconify/react';
import Deployment from '@kinvolk/headlamp-plugin/lib/K8s/deployment';
import { useMemo } from 'react';
import {
  GitRepository,
  HelmRelease,
  HelmRepository,
  Kustomization,
  OCIRepository,
} from './common/Resources';
import { FluxHelmReleaseDetailView } from './helm-releases/HelmReleaseSingle';
import { useNamespaces } from './helpers';
import { FluxKustomizationDetailView } from './kustomizations/KustomizationSingle';
import { store } from './settings';
import { FluxSourceDetailView } from './sources/SourceSingle';

export const makeKubeToKubeEdge = (from: any, to: any): any => ({
  id: `${from.metadata.uid}-${to.metadata.uid}`,
  source: from.metadata.uid,
  target: to.metadata.uid,
});

const GitRepositoryDetails = ({ node }) => (
  <FluxSourceDetailView
    pluralName="gitrepositories"
    name={node.kubeObject.jsonData.metadata.name}
    namespace={node.kubeObject.jsonData.metadata.namespace}
  />
);
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

const gitRepositorySource: any = {
  id: 'flux-git-repository',
  label: 'Git Repository',
  icon: <Icon icon="simple-icons:flux" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [repositories] = GitRepository.useList();
    return useMemo(() => {
      if (!repositories) return null;

      const nodes = repositories?.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        detailsComponent: GitRepositoryDetails,
        weight: 1100,
      }));
      const edges: any[] = [];

      return {
        nodes,
        edges,
      };
    }, [repositories]);
  },
};

const helmRepositorySource: any = {
  id: 'flux-helm-repository',
  label: 'Helm Repository',
  icon: <Icon icon="simple-icons:flux" width="100%" height="100%" color="rgb(50, 108, 229)" />,
  useData() {
    const [repositories] = HelmRepository.useList();
    const [releases] = HelmRelease.useList();

    const useConf = store.useConfig();
    const config = useConf();

    return useMemo(() => {
      if (!repositories || !releases) return null;

      const nodes = repositories?.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        detailsComponent: HelmRepositoryDetails,
        weight: 1100,
      }));
      const edges: any[] = [];

      if (!config?.linkHRelToKs) {
        repositories?.forEach(repo => {
          const { name } = repo.metadata;

          const release = releases?.find(
            it =>
              it.jsonData.spec?.chart?.spec?.sourceRef?.kind === 'HelmRepository' &&
              it.jsonData.spec?.chart?.spec?.sourceRef?.name === name
          );

          if (release) {
            edges.push(makeKubeToKubeEdge(repo, release));
          }
        });
      }

      return {
        nodes,
        edges,
      };
    }, [repositories, releases, config]);
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
        weight: 1100,
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
    const [gitRepositories] = GitRepository.useList();
    const [helmReleases] = HelmRelease.useList();
    const [helmRepositories] = HelmRepository.useList();
    const [kustomizations] = Kustomization.useList({ namespace: useNamespaces() });
    const [ociRepositories] = OCIRepository.useList();

    const useConf = store.useConfig();
    const config = useConf();

    return useMemo(() => {
      if (
        !deployments ||
        !gitRepositories ||
        !helmReleases ||
        !helmRepositories ||
        !kustomizations ||
        !ociRepositories
      )
        return null;
      const nodes = kustomizations?.map(it => ({
        id: it.metadata.uid,
        kubeObject: it,
        detailsComponent: KustomizationDetails,
        weight: 1100,
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

        gitRepositories
          ?.filter(
            it =>
              (it.metadata.annotations?.['meta.helm.sh/release-name'] === name &&
                it.metadata.annotations?.['meta.helm.sh/release-namespace'] === namespace) ||
              (it.metadata.labels?.['kustomize.toolkit.fluxcd.io/name'] === name &&
                it.metadata.labels?.['kustomize.toolkit.fluxcd.io/namespace'] === namespace)
          )
          .forEach(gitRepository => {
            if (
              release.jsonData?.spec?.sourceRef?.kind !== 'GitRepository' ||
              release.jsonData?.spec?.sourceRef?.name !== gitRepository.metadata.name
            ) {
              edges.push(makeKubeToKubeEdge(release, gitRepository));
            } else {
              const node = nodes.find(n => n.id === release.metadata.uid);
              if (node) {
                node.weight = 1200;
              }
            }
          });

        if (config?.linkHRelToKs) {
          helmReleases
            ?.filter(
              it =>
                it.metadata.labels?.['kustomize.toolkit.fluxcd.io/name'] === name &&
                it.metadata.labels?.['kustomize.toolkit.fluxcd.io/namespace'] === namespace
            )
            .forEach(helmRelease => {
              edges.push(makeKubeToKubeEdge(release, helmRelease));
            });
        }

        helmRepositories
          ?.filter(
            it =>
              (it.metadata.annotations?.['meta.helm.sh/release-name'] === name &&
                it.metadata.annotations?.['meta.helm.sh/release-namespace'] === namespace) ||
              (it.metadata.labels?.['kustomize.toolkit.fluxcd.io/name'] === name &&
                it.metadata.labels?.['kustomize.toolkit.fluxcd.io/namespace'] === namespace)
          )
          .forEach(helmRepository => {
            edges.push(makeKubeToKubeEdge(release, helmRepository));
          });

        kustomizations
          ?.filter(
            it =>
              it.metadata.labels?.['kustomize.toolkit.fluxcd.io/name'] === name &&
              it.metadata.labels?.['kustomize.toolkit.fluxcd.io/namespace'] === namespace
          )
          .forEach(kustomization => {
            edges.push(makeKubeToKubeEdge(release, kustomization));
          });

        ociRepositories
          ?.filter(
            it =>
              (it.metadata.annotations?.['meta.helm.sh/release-name'] === name &&
                it.metadata.annotations?.['meta.helm.sh/release-namespace'] === namespace) ||
              (it.metadata.labels?.['kustomize.toolkit.fluxcd.io/name'] === name &&
                it.metadata.labels?.['kustomize.toolkit.fluxcd.io/namespace'] === namespace)
          )
          .forEach(ociRepository => {
            edges.push(makeKubeToKubeEdge(release, ociRepository));
          });
      });

      return {
        nodes,
        edges,
      };
    }, [
      deployments,
      gitRepositories,
      helmReleases,
      helmRepositories,
      kustomizations,
      ociRepositories,
      config,
    ]);
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
  sources: [
    gitRepositorySource,
    helmReleaseSource,
    helmRepositorySource,
    kustomizationSource,
    ociSource,
  ],
};
