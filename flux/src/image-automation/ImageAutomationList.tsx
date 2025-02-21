import {
  SectionBox,
  SectionFilterHeader,
  ShowHideLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObjectIface, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { makeCustomResourceClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/crd';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import React from 'react';
import { NotSupported } from '../checkflux';
import SourceLink from '../common/Link';
import Table from '../common/Table';
import { NameLink } from '../helpers';

const imageGroup = 'image.toolkit.fluxcd.io';
const imageVersion = 'v1beta2';

export function imageRepositoriesClass() {
  return makeCustomResourceClass({
    apiInfo: [{ group: imageGroup, version: imageVersion }],
    isNamespaced: true,
    singularName: 'imagerepository',
    pluralName: 'imagerepositories',
  });
}

export function imagePolicyClass() {
  return makeCustomResourceClass({
    apiInfo: [{ group: imageGroup, version: imageVersion }],
    isNamespaced: true,
    singularName: 'imagepolicy',
    pluralName: 'imagepolicies',
  });
}

export function imageUpdateAutomationClass() {
  return makeCustomResourceClass({
    apiInfo: [{ group: imageGroup, version: imageVersion }],
    isNamespaced: true,
    singularName: 'imageupdateautomation',
    pluralName: 'imageupdateautomations',
  });
}

export function ImageAutomation() {
  return (
    <>
      <ImageRepositoryList resourceClass={imageRepositoriesClass()} />
      <ImagePolicyList resourceClass={imagePolicyClass()} />
      <ImageUpdateAutomationList resourceClass={imageUpdateAutomationClass()} />
    </>
  );
}

function ImageUpdateAutomationList(props: { resourceClass: KubeObjectIface<KubeObjectInterface> }) {
  const { resourceClass } = props;
  const [resources, setResources] = React.useState(null);
  const [error, setError] = React.useState(null);

  resourceClass.useApiList(setResources, setError);

  return (
    <SectionBox title="Image Update Automations">
      {error?.status === 404 && <NotSupported typeName="Image Update Automations" />}
      <Table
        data={resources}
        columns={[
          NameLink(resourceClass),
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
  );
}

function ImagePolicyList(props: { resourceClass: KubeObjectIface<KubeObjectInterface> }) {
  const { resourceClass } = props;
  const [resources, setResources] = React.useState(null);
  const [error, setError] = React.useState(null);

  resourceClass.useApiList(setResources, setError);

  return (
    <SectionBox title="Image Policies">
      {error?.status === 404 && <NotSupported typeName="Image Policies" />}
      <Table
        data={resources}
        columns={[
          NameLink(resourceClass),
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

function ImageRepositoryList(props: { resourceClass: KubeObjectIface<KubeObjectInterface> }) {
  const { resourceClass } = props;
  const [resources, setResources] = React.useState(null);
  const [error, setError] = React.useState(null);

  resourceClass.useApiList(setResources, setError);

  return (
    <SectionBox title={<SectionFilterHeader title="Image Repositories" />}>
      {error?.status === 404 && <NotSupported typeName="Image Repositories" />}
      <Table
        data={resources}
        columns={[
          NameLink(resourceClass),
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
