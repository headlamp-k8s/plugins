import { KubeObject } from "@kinvolk/headlamp-plugin/lib/lib/k8s/cluster";

export function getSourceNameAndType(item: KubeObject) {
    const itemKind = item.jsonData.kind;
    let type = '';
    let name = '';
    console.log(item);
    if(itemKind === 'Kustomization') {
      switch(item.jsonData.spec.sourceRef.kind) {
        case 'GitRepository':
          type = 'gitrepositories';
          break;
        case 'OCIRepository':
          type = 'ocirepositories';
          break;
        case 'Bucket':
          type = 'buckets';
          break;
      }
      name = item.jsonData.spec?.sourceRef?.name;
    } else if(itemKind === 'HelmRelease') {
        console.log(item?.jsonData?.spec?.chartRef?.kind);
      switch(item?.jsonData?.spec?.chartRef?.kind) {
        case 'GitRepository':
          type = 'gitrepositories';
          break;
        case 'OCIRepository':
          type = 'ocirepositories';
          break;
        case 'Bucket':
          type = 'buckets';
          break;
      }
      if(item?.jsonData?.spec?.chartRef) {
        name = item?.jsonData?.spec?.chartRef?.name;
      }
      switch(item?.jsonData?.spec?.chart?.spec?.sourceRef?.kind) {
        case 'HelmRepository':
          type = 'helmrepositories';
          break;
        case 'HelmChart':
          type = 'helmcharts';
          break;
      }
      if(item?.jsonData?.spec?.chart?.spec?.sourceRef) {
        name = item?.jsonData?.spec?.chart?.spec?.sourceRef?.name
      }
    }
    console.log('type is ', type);
    return { name, type };
  }