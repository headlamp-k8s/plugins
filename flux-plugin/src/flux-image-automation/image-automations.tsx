import { DateLabel, Link, SectionBox, Table } from '@kinvolk/headlamp-plugin/lib/components/common';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { apiFactory } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import React from 'react';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import CheckIfFluxInstalled from '../checkflux';

export default function ImageAutomation() {
  const CRD = K8s.ResourceClasses.CustomResourceDefinition;
  CRD.apiEndpoint = apiFactory(
    ['apiextensions.k8s.io', 'v1', 'customresourcedefinitions'],
    ['apiextensions.k8s.io', 'v1beta1', 'customresourcedefinitions'],
    ['apiextensions.k8s.io', 'v1beta2', 'customresourcedefinitions']
  );
  const [imageRepository] = CRD.useGet('imagerepositories.image.toolkit.fluxcd.io');

  const imageRepositoryClass = React.useMemo(() => {
    return imageRepository?.makeCRClass();
  }, [imageRepository]);
  console.log(imageRepository);

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
  console.log(imageUpdateAutomations);

  return (
    <>
      <SectionBox title="Image Update Automations">
        <Table
          data={imageUpdateAutomations}
          columns={[
            {
              header: 'Name',
              accessorFn: item => (
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
            {
              header: 'Namespace',
              accessorFn: item => (
                <Link
                  routeName="namespace"
                  params={{
                    name: item.metadata.namespace,
                  }}
                >
                  {item.metadata.namespace}
                </Link>
              ),
            },
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
              accessorFn: item => item.jsonData.spec.git && JSON.stringify(item.jsonData.spec.git),
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
            {
              header: 'Age',
              accessorFn: item => <DateLabel date={item.metadata.creationTimestamp} />,
            },
          ]}
        />
      </SectionBox>
    </>
  );
}
function ImagePolicyList(props: { resourceClass: KubeObject }) {
  const { resourceClass } = props;
  const [imagePolicies] = resourceClass?.useList();
  console.log(imagePolicies);

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
          {
            header: 'Namespace',
            accessorFn: item => (
              <Link
                routeName="namespace"
                params={{
                  name: item.metadata.namespace,
                }}
              >
                {item.metadata.namespace}
              </Link>
            ),
          },
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
          {
            header: 'Age',
            accessorFn: item => <DateLabel date={item.metadata.creationTimestamp} />,
          },
        ]}
      />
    </SectionBox>
  );
}

function ImageRepositoryList(props: { resourceClass: KubeObject }) {
  const { resourceClass } = props;
  const [imageRepositories] = resourceClass?.useList();
  console.log(imageRepositories);

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
          {
            header: 'Namespace',
            accessorFn: item => (
              <Link
                routeName="namespace"
                params={{
                  name: item.metadata.namespace,
                }}
              >
                {item.metadata.namespace}
              </Link>
            ),
          },
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
          {
            header: 'Age',
            accessorFn: item => <DateLabel date={item.metadata.creationTimestamp} />,
          },
        ]}
      />
    </SectionBox>
  );
}
