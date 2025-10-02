import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';

export class Kustomization extends KubeObject {
  static kind = 'Kustomization';
  static apiName = 'kustomizations';
  static apiVersion = 'kustomize.toolkit.fluxcd.io/v1';
  static isNamespaced = true;
}

export class HelmRelease extends KubeObject {
  static kind = 'HelmRelease';
  static apiName = 'helmreleases';
  static apiVersion = ['helm.toolkit.fluxcd.io/v2', 'helm.toolkit.fluxcd.io/v2beta1'];
  static isNamespaced = true;
}

export class GitRepository extends KubeObject {
  static kind = 'GitRepository';
  static apiName = 'gitrepositories';
  static apiVersion = 'source.toolkit.fluxcd.io/v1';
  static isNamespaced = true;
}

export class OCIRepository extends KubeObject {
  static kind = 'OCIRepository';
  static apiName = 'ocirepositories';
  static apiVersion = 'source.toolkit.fluxcd.io/v1beta2';
  static isNamespaced = true;
}

export class BucketRepository extends KubeObject {
  static kind = 'Bucket';
  static apiName = 'buckets';
  static apiVersion = ['source.toolkit.fluxcd.io/v1', 'source.toolkit.fluxcd.io/v1beta2'];
  static isNamespaced = true;
}

export class HelmRepository extends KubeObject {
  static kind = 'HelmRepository';
  static apiName = 'helmrepositories';
  static apiVersion = ['source.toolkit.fluxcd.io/v1', 'source.toolkit.fluxcd.io/v1beta2'];
  static isNamespaced = true;
}

export class HelmChart extends KubeObject {
  static kind = 'HelmChart';
  static apiName = 'helmcharts';
  static apiVersion = ['source.toolkit.fluxcd.io/v1', 'source.toolkit.fluxcd.io/v1beta2'];
  static isNamespaced = true;
}

export class ExternalArtifact extends KubeObject {
  static kind = 'ExternalArtifact';
  static apiName = 'externalartifacts';
  static apiVersion = 'source.toolkit.fluxcd.io/v1';
  static isNamespaced = true;
}

export class AlertNotification extends KubeObject {
  static kind = 'Alert';
  static apiName = 'alerts';
  static apiVersion = [
    'notification.toolkit.fluxcd.io/v1beta3',
    'notification.toolkit.fluxcd.io/v1beta2',
  ];
  static isNamespaced = true;
}

export class ProviderNotification extends KubeObject {
  static kind = 'Provider';
  static apiName = 'providers';
  static apiVersion = [
    'notification.toolkit.fluxcd.io/v1beta3',
    'notification.toolkit.fluxcd.io/v1beta2',
  ];
  static isNamespaced = true;
}

export class ReceiverNotification extends KubeObject {
  static kind = 'Receiver';
  static apiName = 'receivers';
  static apiVersion = [
    'notification.toolkit.fluxcd.io/v1beta3',
    'notification.toolkit.fluxcd.io/v1beta2',
    'notification.toolkit.fluxcd.io/v1',
  ];
  static isNamespaced = true;
}

export class ImageUpdateAutomation extends KubeObject {
  static kind = 'ImageUpdateAutomation';
  static apiName = 'imageupdateautomations';
  static apiVersion = [
    'image.toolkit.fluxcd.io/v1',
    'image.toolkit.fluxcd.io/v1beta2',
    'image.toolkit.fluxcd.io/v1beta1',
  ];
  static isNamespaced = true;
}

export class ImagePolicy extends KubeObject {
  static kind = 'ImagePolicy';
  static apiName = 'imagepolicies';
  static apiVersion = ['image.toolkit.fluxcd.io/v1', 'image.toolkit.fluxcd.io/v1beta2'];
  static isNamespaced = true;
}

export class ImageRepository extends KubeObject {
  static kind = 'ImageRepository';
  static apiName = 'imagerepositories';
  static apiVersion = ['image.toolkit.fluxcd.io/v1', 'image.toolkit.fluxcd.io/v1beta2'];
  static isNamespaced = true;
}

export const getSourceClassByPluralName = (pluralName: string) =>
  ({
    gitrepositories: GitRepository,
    ocirepositories: OCIRepository,
    buckets: BucketRepository,
    helmrepositories: HelmRepository,
    helmcharts: HelmChart,
    externalartifacts: ExternalArtifact,
  }[pluralName]);
