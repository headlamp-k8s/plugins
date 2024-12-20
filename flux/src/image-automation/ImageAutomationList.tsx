import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { apiFactory } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import {
  Link,
  Loader,
  SectionBox,
  SectionFilterHeader,
  ShowHideLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Link as MuiLink } from '@mui/material';
import React from 'react';
import { useTheme } from '@mui/material/styles';
import  { useFluxControllerAvailableCheck, useFluxInstallCheck } from '../checkflux';
import SourceLink from '../common/Link';
import Table from '../common/Table';
import Flux404 from '../checkflux';

const IMAGE_AUTOMATION_BETA_VERSION = 'v1beta2';

function ImageAutomation() {
  const CRD = K8s.ResourceClasses.CustomResourceDefinition;
  const isFluxInstalled = useFluxInstallCheck();
  const isVersionAvailable = CRD.apiEndpoint.apiInfo.find(
    apiInfo => apiInfo.version === IMAGE_AUTOMATION_BETA_VERSION
  );
  if (!isVersionAvailable) {
    CRD.apiEndpoint = apiFactory(
      ...CRD.apiEndpoint.apiInfo.map(apiInfo => {
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

  if(isFluxInstalled === null){
    return <Loader />;
  }

  if(!isFluxInstalled){
    return <Flux404 />;
  }

  return (
    <>
      {imageRepository && <ImageRepositoryList resourceClass={imageRepositoryClass} />}
      {imagePolicy && <ImagePolicyList resourceClass={imagePolicyClass} />}
      {imageUpdateAutomation && (
        <ImageUpdateAutomationList resourceClass={imageUpdateAutomationClass} />
      )}
    </>
  );
}

export default function ImageAutomationWrapper() {
  const isImageAutomationControllerAvailable = useFluxControllerAvailableCheck({
    name: 'image-automation-controller',
  });

  if (isImageAutomationControllerAvailable === null) {
    return <Loader />;
  }

  if (!isImageAutomationControllerAvailable) {
    return (
      <SectionBox sx={{
        padding: '1rem',
        alignItems: 'center',
        margin: '2rem auto',
        maxWidth: '600px',
      }}>
        <h1>Image Automation Controller is not installed</h1>
        <p>
          Follow the{' '}
          <MuiLink target="_blank" href="https://fluxcd.io/docs/components/image/">
            installation guide
          </MuiLink>{' '}
          to install Image Automation Controller on your cluster
        </p>
      </SectionBox>
    );
  }

  return <ImageAutomation />;
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
                  routeName={`/flux/image-automations/:type/:namespace/:name`}
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
            'status',
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
          filterFunction={useFilterFunc()}
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
                routeName={`/flux/image-automations/:type/:namespace/:name`}
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
          'status',
          {
            header: 'Policy',
            accessorFn: item =>
              item.jsonData.spec.policy && JSON.stringify(item.jsonData.spec.policy),
          },
          'age',
        ]}
        filterFunction={useFilterFunc()}
      />
    </SectionBox>
  );
}

function ImageRepositoryList(props: { resourceClass: KubeObject }) {
  const { resourceClass } = props;
  const [imageRepositories] = resourceClass?.useList();

  return (
    <SectionBox title={<SectionFilterHeader title="Image Repositories" />}>
      <Table
        data={imageRepositories}
        columns={[
          {
            header: 'Name',
            accessorFn: item => (
              <Link
                routeName={`/flux/image-automations/:type/:namespace/:name`}
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
          'status',
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
            accessorFn: item => <SourceLink wrap url={item.jsonData.spec.image} />,
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
        filterFunction={useFilterFunc()}
      />
    </SectionBox>
  );
}
