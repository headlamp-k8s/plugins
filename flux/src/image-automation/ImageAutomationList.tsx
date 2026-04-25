import {
  DateLabel,
  SectionBox,
  SectionFilterHeader,
  ShowHideLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useFilterFunc } from '@kinvolk/headlamp-plugin/lib/Utils';
import React from 'react';
import YAML from 'yaml';
import { NotSupported } from '../checkflux';
import SourceLink from '../common/Link';
import { ImagePolicy, ImageRepository, ImageUpdateAutomation } from '../common/Resources';
import Table from '../common/Table';
import { NameLink, useNamespaces } from '../helpers';

export function ImageAutomation() {
  return (
    <>
      <ImageRepositoryList />
      <ImagePolicyList />
      <ImageUpdateAutomationList />
    </>
  );
}

function ImageUpdateAutomationList() {
  const filterFunction = useFilterFunc();
  const [resources, error] = ImageUpdateAutomation.useList({ namespace: useNamespaces() });

  if (error?.status === 404) {
    return <NotSupported typeName="Image Update Automations" />;
  }

  return (
    <SectionBox title="Image Update Automations">
      <Table
        data={resources}
        columns={[
          NameLink(ImageUpdateAutomation),
          'namespace',
          'status',
          {
            header: 'Last Push',
            accessorFn: item => (
              <DateLabel date={item.jsonData.status?.lastPushTime} format="mini" />
            ),
          },
          {
            header: 'Git',
            accessorFn: item =>
              item.jsonData.spec.git?.checkout?.ref && (
                <ShowHideLabel labelId={item?.metadata.uid}>
                  {YAML.stringify(item.jsonData.spec.git.checkout.ref)}
                </ShowHideLabel>
              ),
          },
          {
            header: 'Interval',
            accessorFn: item => item.jsonData.spec.interval,
            gridTemplate: 'min-content',
          },
          {
            header: 'Update',
            accessorFn: item =>
              item.jsonData.spec.update && YAML.stringify(item.jsonData.spec.update),
          },
          'age',
        ]}
        filterFunction={filterFunction}
      />
    </SectionBox>
  );
}

function ImagePolicyList() {
  const filterFunction = useFilterFunc();
  const [resources, error] = ImagePolicy.useList({ namespace: useNamespaces() });

  if (error?.status === 404) {
    return <NotSupported typeName="Image Update Policies" />;
  }

  return (
    <SectionBox title="Image Policies">
      <Table
        data={resources}
        columns={[
          NameLink(ImagePolicy),
          'namespace',
          'status',
          {
            header: 'Policy',
            accessorFn: item =>
              item.jsonData.spec.policy && YAML.stringify(item.jsonData.spec.policy),
          },
          {
            header: 'Latest',
            accessorFn: item => item.jsonData.status?.latestImage,
          },
          'age',
        ]}
        filterFunction={filterFunction}
      />
    </SectionBox>
  );
}

function ImageRepositoryList() {
  const filterFunction = useFilterFunc();
  const [resources, error] = ImageRepository.useList({ namespace: useNamespaces() });

  if (error?.status === 404) {
    return <NotSupported typeName="Image Repositories" />;
  }

  return (
    <SectionBox title={<SectionFilterHeader title="Image Repositories" />}>
      <Table
        data={resources}
        columns={[
          NameLink(ImageRepository),
          'namespace',
          'status',
          {
            header: 'Image',
            accessorFn: item => <SourceLink wrap url={item.jsonData.spec.image} />,
          },
          {
            header: 'Tags',
            accessorFn: item => item.jsonData.status.lastScanResult?.tagCount,
            gridTemplate: 'min-content',
          },
          {
            header: 'Secret Ref',
            accessorFn: item => item.jsonData.spec?.secretRef?.name || '-',
          },
          {
            header: 'Interval',
            accessorFn: item => item.jsonData.spec.interval,
            gridTemplate: 'min-content',
          },
          'age',
        ]}
        filterFunction={filterFunction}
      />
    </SectionBox>
  );
}
