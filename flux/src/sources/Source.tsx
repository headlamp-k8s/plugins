import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { getSourceNameAndPluralKind } from '../helpers';
import {
  bucketRepositoryClass,
  gitRepositoryClass,
  helmChartClass,
  helmRepositoryClass,
  ociRepositoryClass,
} from './SourceList';

export function GetSourceClass(pluralName: string) {
  return (() => {
    switch (pluralName) {
      case 'gitrepositories':
        return gitRepositoryClass();
      case 'ocirepositories':
        return ociRepositoryClass();
      case 'buckets':
        return bucketRepositoryClass();
      case 'helmrepositories':
        return helmRepositoryClass();
      case 'helmcharts':
        return helmChartClass();
      default:
        return null;
    }
  })();
}

export function GetSource(props: { item: KubeObject | null; setSource: (...args) => void }) {
  const { item, setSource } = props;
  const namespace = item.jsonData.metadata.namespace;

  const { name, pluralKind, namespace: sourceNamespace } = getSourceNameAndPluralKind(item);

  const resourceClass = GetSourceClass(pluralKind);
  resourceClass.useApiGet(setSource, name, sourceNamespace ?? namespace);

  return <></>;
}
