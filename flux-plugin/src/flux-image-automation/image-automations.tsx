import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { apiFactory } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  DateLabel,
  Link,
  SectionBox,
  ShowHideLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import React from 'react';
import Table from '../common/Table';
import CheckIfFluxInstalled from '../checkflux';

const IMAGE_AUTOMATION_BETA_VERSION = 'v1beta2';

export default function ImageAutomation() {
  const CRD = K8s.ResourceClasses.CustomResourceDefinition;
  const isVersionAvailable = CRD.apiEndpoint.apiInfo.find(
    apiInfo => apiInfo.version === IMAGE_AUTOMATION_BETA_VERSION
  );
  if (!isVersionAvailable) {
    CRD.apiEndpoint = apiFactory(
      ...CRD.apiEndpoint.apiInfo.map((apiInfo) => {
        const params = [];
        params.push(apiInfo.group);
        params.push(apiInfo.version);
        params.push(apiInfo.resource);
        return params;
      }),
      ['apiextensions.k8s.io', IMAGE_AUTOMATION_BETA_VERSION, 'customresourcedefinitions']
    );
  }
  const [imageRepository] = CRD.useGet('imagerepositories.image.toolkit.fluxcd.io');

  const imageRepositoryClass = React.useMemo(() => {
    return imageRepository?.makeCRClass();
  }, [imageRepository]);

  const [imagePolicy] = CRD.useGet('imagepolicies.image.toolkit.fluxcd.io');
  const imagePolicyClass = React.useMemo(() => {
    return imagePolicy?.makeCRClass();
  }, [imagePolicy]);

  const [imageUpdateAutomation] = CRD.useGet('imageupdateautomations.image.toolkit.fluxcd.io');
  const imageUpdateAutomationClass = React.useMemo(() => {
    return imageUpdateAutomation?.makeCRClass();
  }, [imageUpdateAutomation]);

  return (
    <>
      <CheckIfFluxInstalled />
      {imageRepository && <ImageRepositoryList resourceClass={imageRepositoryClass} />}
      {imagePolicy && <ImagePolicyList resourceClass={imagePolicyClass} />}
      {imageUpdateAutomation && (
        <ImageUpdateAutomationList resourceClass={imageUpdateAutomationClass} />
      )}
    </>
  );
}

function ImageUpdateAutomationList(props: { resourceClass: KubeObject }) {
  const { resourceClass } = props;
  const [imageUpdateAutomations] = resourceClass?.useList();

  return (
    <>
      <SectionBox title="Image Update Automations">
        <Table
          data={imageUpdateAutomations}
          columns={[
            {
              header: 'Name',
              accessorKey: 'metadata.name',
              Cell: ({ row: { original: item } }) => (
                <Link
                  routeName={`/flux/image-automations/:namespace/:type/:name`}
                  params={{
                    name: item.metadata.name,
                    namespace: item.metadata.namespace,
                    type: 'imageupdateautomations',
                  }}
                >
                  {item?.jsonData?.metadata.name}
                </Link>
              ),
            },
            'namespace',
            {
              header: 'Ready',
              accessorFn: item => {
                const ready =
                  item.jsonData.status?.conditions?.findIndex(c => c.type === 'Ready') !== -1
                    ? 'True'
                    : 'False';
                return ready;
              },
            },
            {
              header: 'Git',
              accessorFn: item =>
                item.jsonData.spec.git && (
                  <ShowHideLabel labelId={item?.metadata.uid}>
                    {JSON.stringify(item.jsonData.spec.git)}
                  </ShowHideLabel>
                ),
            },
            {
              header: 'Interval',
              accessorFn: item => item.jsonData.spec.interval,
            },
            {
              header: 'Update',
              accessorFn: item =>
                item.jsonData.spec.update && JSON.stringify(item.jsonData.spec.update),
            },
            'age',
          ]}
        />
      </SectionBox>
    </>
  );
}
function ImagePolicyList(props: { resourceClass: KubeObject }) {
  const { resourceClass } = props;
  const [imagePolicies] = resourceClass?.useList();

  return (
    <SectionBox title="Image Policies">
      <Table
        data={imagePolicies}
        columns={[
          {
            header: 'Name',
            accessorFn: item => (
              <Link
                routeName={`/flux/image-automations/:namespace/:type/:name`}
                params={{
                  name: item.metadata.name,
                  namespace: item.metadata.namespace,
                  type: 'imagepolicies',
                }}
              >
                {item?.jsonData?.metadata.name}
              </Link>
            ),
          },
          'namespace',
          {
            header: 'Ready',
            accessorFn: item => {
              const ready =
                item.jsonData.status?.conditions?.findIndex(c => c.type === 'Ready') !== -1
                  ? 'True'
                  : 'False';
              return ready;
            },
          },
          {
            header: 'Policy',
            accessorFn: item =>
              item.jsonData.spec.policy && JSON.stringify(item.jsonData.spec.policy),
          },
          'age',
        ]}
      />
    </SectionBox>
  );
}

function ImageRepositoryList(props: { resourceClass: KubeObject }) {
  const { resourceClass } = props;
  const [imageRepositories] = resourceClass?.useList();

  return (
    <SectionBox title="Image Repositories">
      <Table
        data={imageRepositories}
        columns={[
          {
            header: 'Name',
            accessorFn: item => (
              <Link
                routeName={`/flux/image-automations/:namespace/:type/:name`}
                params={{
                  name: item.metadata.name,
                  namespace: item.metadata.namespace,
                  type: 'imagerepositories',
                }}
              >
                {item?.jsonData?.metadata.name}
              </Link>
            ),
          },
          'namespace',
          {
            header: 'Ready',
            accessorFn: item => {
              const ready =
                item.jsonData.status?.conditions?.findIndex(c => c.type === 'Ready') !== -1
                  ? 'True'
                  : 'False';
              return ready;
            },
          },
          {
            header: 'Insecure',
            accessorFn: item => item.jsonData.spec.insecure || 'False',
          },
          {
            header: 'Secret Ref',
            accessorFn: item => item.jsonData.spec?.secretRef?.name || '-',
          },
          {
            header: 'Image',
            accessorFn: item => item.jsonData.spec.image,
          },
          {
            header: 'Interval',
            accessorFn: item => item.jsonData.spec.interval,
          },
          {
            header: 'Schedule',
            accessorFn: item => item.jsonData.spec.schedule,
          },
          {
            header: 'Service Account',
            accessorFn: item => item.jsonData.spec.serviceAccountName || '-',
          },
          {
            header: 'Timeout',
            accessorFn: item => item.jsonData.spec.timeout,
          },
          'age',
        ]}
      />
    </SectionBox>
  );
}
