import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { getSourceNameAndType } from '../helpers';
import {
  bucketRepositoryClass,
  gitRepositoryClass,
  helmChartClass,
  helmRepositoryClass,
  ociRepositoryClass,
} from './SourceList';

export function GetSourceClass(pluralKind: string) {
  return (() => {
    switch (pluralKind) {
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

  const { name, type } = getSourceNameAndType(item);

  const resourceClass = GetSourceClass(type);
  resourceClass.useApiGet(setSource, name, namespace);

  return <></>;
}
