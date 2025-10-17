import {
  ConditionsTable,
  Link as HeadlampLink,
  MainInfoSection,
  SectionBox,
  Table,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Editor from '@monaco-editor/react';
import React, { ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import YAML from 'yaml';
import { ResumeAction, SuspendAction, SyncAction } from '../actions/index';
import Flux404 from '../checkflux';
import Link from '../common/Link';
import RemainingTimeDisplay from '../common/RemainingTimeDisplay';
import { ImagePolicy, ImageRepository, ImageUpdateAutomation } from '../common/Resources';
import StatusLabel from '../common/StatusLabel';
import { ObjectEvents } from '../helpers/index';

export function FluxImageAutomationDetailView() {
  const { pluralName, namespace, name } = useParams<{
    pluralName: string;
    namespace: string;
    name: string;
  }>();

  const resourceClass = (() => {
    switch (pluralName) {
      case 'imagerepositories':
        return ImageRepository;
      case 'imagepolicies':
        return ImagePolicy;
      case 'imageupdateautomations':
        return ImageUpdateAutomation;
      default:
        return null;
    }
  })();

  if (!resourceClass) {
    return <Flux404 message={`Unknown type ${pluralName}`} />;
  }

  return (
    <>
      <CustomResourceDetails resourceClass={resourceClass} name={name} namespace={namespace} />
      <ObjectEvents name={name} namespace={namespace} resourceClass={resourceClass} />
    </>
  );
}

function CustomResourceDetails(props) {
  const { name, namespace, resourceClass } = props;

  const themeName = localStorage.getItem('headlampThemePreference');

  const [resource] = resourceClass.useGet(name, namespace);

  function prepareExtraInfo() {
    if (!resource) {
      return [];
    }
    const extraInfo: Array<{ name: string; value: ReactNode }> = [
      {
        name: 'Status',
        value: <StatusLabel item={resource} />,
      },
    ];

    if (resource.jsonData.kind === 'ImageRepository') {
      extraInfo.push({
        name: 'Image',
        value: <Link url={resource.jsonData.spec?.image} />,
      });
      extraInfo.push({
        name: 'Provider',
        value: resource.jsonData.spec?.provider || 'None',
      });
      extraInfo.push({
        name: 'Exclusion List',
        value: resource.jsonData.spec?.exclusionList
          ? resource.jsonData.spec?.exclusionList.join(', ')
          : 'None',
      });
      extraInfo.push({
        name: 'Canonical Image Name',
        value: resource.jsonData?.status?.canonicalImageName || '-',
      });
    }

    if (resource.jsonData.kind === 'ImagePolicy') {
      extraInfo.push({
        name: 'Image Repository',
        value: (
          <HeadlampLink
            routeName="image"
            params={{
              name: resource.jsonData.spec?.imageRepositoryRef.name,
              namespace:
                resource.jsonData.spec.imageRepositoryRef.namespace ??
                resource.jsonData.metadata.namespace,
              pluralName: 'imagerepositories',
            }}
          >
            {resource.jsonData.spec?.imageRepositoryRef.name}
          </HeadlampLink>
        ),
      });
      extraInfo.push({
        name: 'Policy',
        value: resource?.jsonData.spec?.policy && (
          <Editor
            theme={themeName === 'dark' ? 'vs-dark' : 'light'}
            language="yaml"
            value={YAML.stringify(resource?.jsonData.spec?.policy)}
            height={150}
            options={{
              // no lines
              lineNumbers: 'off',
            }}
          />
        ),
      });
    }

    if (resource.jsonData.kind === 'ImageUpdateAutomation') {
      extraInfo.push({
        name: 'Git',
        value: resource.jsonData.spec?.git && (
          <Editor
            theme={themeName === 'dark' ? 'vs-dark' : 'light'}
            language="yaml"
            value={YAML.stringify(resource.jsonData.spec?.git)}
            height={200}
            options={{
              // no lines
              lineNumbers: 'off',
            }}
          />
        ),
      });
    }

    if (resource.jsonData.kind !== 'ImagePolicy') {
      extraInfo.push({
        name: 'Suspend',
        value: resource.jsonData.spec?.suspend ? 'True' : 'False',
      });
      if (resource.jsonData?.spec?.interval) {
        extraInfo.push({
          name: 'Interval',
          value: resource.jsonData.spec.interval,
        });
      }

      if (!resource.jsonData.spec?.suspend) {
        extraInfo.push({
          name: 'Next Reconciliation',
          value: <RemainingTimeDisplay item={resource} />,
        });
      }
    }
    return extraInfo;
  }

  return (
    <>
      <MainInfoSection
        resource={resource}
        extraInfo={prepareExtraInfo()}
        actions={
          resourceClass.pluralName === ImagePolicy.pluralName
            ? []
            : [
                <SyncAction resource={resource} />,
                <SuspendAction resource={resource} />,
                <ResumeAction resource={resource} />,
              ]
        }
      />
      {resourceClass.pluralName === ImageRepository.pluralName && (
        <TagList resource={resource?.jsonData} />
      )}
      {resourceClass.pluralName === ImageUpdateAutomation.pluralName && (
        <Policies resource={resource?.jsonData} />
      )}
      <SectionBox title="Conditions">
        <ConditionsTable resource={resource?.jsonData} />
      </SectionBox>
    </>
  );
}

function TagList(props: { resource }) {
  const { resource } = props;

  return (
    <SectionBox title="Tag List">
      <p>{resource?.status?.lastScanResult?.tagCount} fetched tags</p>
      <Table
        data={resource?.status?.lastScanResult?.latestTags}
        columns={[
          {
            header: 'Tag',
            accessorFn: item => item,
          },
        ]}
      />
    </SectionBox>
  );
}

function Policies(props: { resource }) {
  const { resource } = props;

  const policies: any = Object.entries(resource?.status?.observedPolicies || {});

  return (
    <SectionBox title="Policies">
      <Table
        data={policies}
        columns={[
          {
            header: 'Policy',
            accessorFn: item => item[0],
            Cell: ({ cell }) => (
              <HeadlampLink
                routeName="image"
                params={{
                  name: cell.getValue(),
                  namespace: resource.metadata.namespace,
                  pluralName: 'imagepolicies',
                }}
              >
                {cell.getValue()}
              </HeadlampLink>
            ),
          },
          {
            header: 'Image',
            accessorFn: item => item[1].name,
          },
          {
            header: 'Tag',
            accessorFn: item => item[1].tag,
          },
        ]}
      />
    </SectionBox>
  );
}
