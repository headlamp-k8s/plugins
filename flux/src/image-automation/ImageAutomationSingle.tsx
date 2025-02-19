import {
  ConditionsTable,
  MainInfoSection,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Event from '@kinvolk/headlamp-plugin/lib/k8s/event';
import Editor from '@monaco-editor/react';
import React from 'react';
import { useParams } from 'react-router-dom';
import YAML from 'yaml';
import {
  ForceReconciliationAction,
  ResumeAction,
  SuspendAction,
  SyncAction,
} from '../actions/index';
import Link from '../common/Link';
import RemainingTimeDisplay from '../common/RemainingTimeDisplay';
import StatusLabel from '../common/StatusLabel';
import { ObjectEvents } from '../helpers/index';
import {
  imagePolicyClass,
  imageRepositoriesClass,
  imageUpdateAutomationClass,
} from './ImageAutomationList';

export function FluxImageAutomationDetailView() {
  const { namespace, type, name } = useParams<{ namespace: string; type: string; name: string }>();

  const resourceClass = (() => {
    switch (type) {
      case 'imagerepositories':
        return imageRepositoriesClass();
      case 'imagepolicies':
        return imagePolicyClass();
      case 'imageupdateautomations':
        return imageUpdateAutomationClass();
      default:
        return null;
    }
  })();

  const [events] = Event?.default.useList({
    namespace,
    fieldSelector: `involvedObject.name=${name},involvedObject.kind=${resourceClass.kind}`,
  });

  return (
    <>
      <CustomResourceDetails resourceClass={resourceClass} name={name} namespace={namespace} />
      <ObjectEvents events={events} />
    </>
  );
}

function CustomResourceDetails(props) {
  const { name, namespace, resourceClass } = props;
  const [resource, setResource] = React.useState(null);

  const themeName = localStorage.getItem('headlampThemePreference');

  resourceClass.useApiGet(setResource, name, namespace);

  function prepareExtraInfo() {
    const extraInfo = [
      {
        name: 'Status',
        value: <StatusLabel item={resource} />,
      },
    ];

    if (resource?.jsonData.kind === 'ImageRepository') {
      extraInfo.push({
        name: 'Image',
        value: <Link url={resource?.jsonData.spec?.image} />,
      });
      extraInfo.push({
        name: 'Provider',
        value: resource?.jsonData.spec?.provider || 'None',
      });
      extraInfo.push({
        name: 'Exclusion List',
        value: resource?.jsonData.spec?.exclusionList
          ? resource?.jsonData.spec?.exclusionList.join(', ')
          : 'None',
      });
      extraInfo.push({
        name: 'Canonical Image Name',
        value: resource?.jsonData?.status?.canonicalImageName || '-',
      });
      extraInfo.push({
        name: 'Last Scan Result',
        value:
          resource?.jsonData?.status?.lastScanResult &&
          JSON.stringify(resource?.jsonData.status?.lastScanResult),
      });
    }
    if (resource?.jsonData.kind === 'ImagePolicy') {
      extraInfo.push({
        name: 'Image Repository Ref',
        value:
          resource?.jsonData.spec?.imageRepositoryRef &&
          JSON.stringify(resource?.jsonData.spec?.imageRepositoryRef),
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

    extraInfo.push({
      name: 'Suspend',
      value: resource?.jsonData.spec?.suspend ? 'True' : 'False',
    });
    if (resource?.jsonData?.spec?.interval) {
      extraInfo.push({
        name: 'Interval',
        value: resource.jsonData.spec.interval,
      });
    }

    if (resource?.jsonData.kind === 'ImageUpdateAutomation') {
      extraInfo.push({
        name: 'Git',
        value: resource?.jsonData.spec?.git && (
          <Editor
            theme={themeName === 'dark' ? 'vs-dark' : 'light'}
            language="yaml"
            value={YAML.stringify(resource?.jsonData.spec?.git)}
            height={200}
            options={{
              // no lines
              lineNumbers: 'off',
            }}
          />
        ),
      });
    }

    if (!resource?.jsonData.spec?.suspend) {
      extraInfo.push({
        name: 'Next Reconciliation',
        value: <RemainingTimeDisplay item={resource} />,
      });
    }
    return extraInfo;
  }

  return (
    <>
      <MainInfoSection
        resource={resource}
        extraInfo={prepareExtraInfo()}
        actions={[
          <SyncAction resource={resource} />,
          <SuspendAction resource={resource} />,
          <ResumeAction resource={resource} />,
          <ForceReconciliationAction resource={resource} />,
        ]}
      />
      <SectionBox title="Conditions">
        <ConditionsTable resource={resource?.jsonData} />
      </SectionBox>
    </>
  );
}
