import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { apiFactory } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
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
import { ForceReconciliationAction, ResumeAction, SuspendAction, SyncAction } from '../actions/index';
import Link from '../common/Link';
import RemainingTimeDisplay from '../common/RemainingTimeDisplay';
import StatusLabel from '../common/StatusLabel';
import { ObjectEvents } from '../helpers/index';

const fluxImageInfo = {
  imagerepositories: {
    kind: 'ImageRepository',
    type: 'imagerepositories.image.toolkit.fluxcd.io',
  },
  imagepolicies: {
    kind: 'ImagePolicy',
    type: 'imagepolicies.image.toolkit.fluxcd.io',
  },
  imageupdateautomations: {
    kind: 'ImageUpdateAutomation',
    type: 'imageupdateautomations.image.toolkit.fluxcd.io',
  },
};

const IMAGE_AUTOMATION_BETA_VERSION = 'v1beta2';
export function FluxImageAutomationDetailView() {
  const { namespace, type, name } = useParams<{ namespace: string; type: string; name: string }>();

  function getType() {
    return fluxImageInfo[type].type;
  }

  function getKind() {
    return fluxImageInfo[type].kind;
  }

  const CRD = K8s.ResourceClasses.CustomResourceDefinition;
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

  const [resource] = CRD.useGet(getType());

  const [events] = Event?.default.useList({
    namespace,
    fieldSelector: `involvedObject.name=${name},involvedObject.kind=${getKind()}`,
  });

  return (
    <>
      {resource && <CustomResourceDetails resource={resource} name={name} namespace={namespace} />}
      <ObjectEvents events={events} />
    </>
  );
}

function CustomResourceDetails(props) {
  const { name, namespace, resource } = props;
  const [cr, setCr] = React.useState(null);
  const resourceClass = React.useMemo(() => {
    return resource.makeCRClass();
  }, [resource]);

  const themeName = localStorage.getItem('headlampThemePreference');

  resourceClass.useApiGet(setCr, name, namespace);

  function prepareExtraInfo() {
    const extraInfo = [
      {
        name: 'Status',
        value: <StatusLabel item={cr} />,
      },
    ];

    if (cr?.jsonData.kind === 'ImageRepository') {
      extraInfo.push({
        name: 'Image',
        value: <Link url={cr?.jsonData.spec?.image} />,
      });
      extraInfo.push({
        name: 'Provider',
        value: cr?.jsonData.spec?.provider || 'None',
      });
      extraInfo.push({
        name: 'Exclusion List',
        value: cr?.jsonData.spec?.exclusionList
          ? cr?.jsonData.spec?.exclusionList.join(', ')
          : 'None',
      });
      extraInfo.push({
        name: 'Canonical Image Name',
        value: cr?.jsonData?.status?.canonicalImageName || '-',
      });
      extraInfo.push({
        name: 'Last Scan Result',
        value:
          cr?.jsonData?.status?.lastScanResult &&
          JSON.stringify(cr?.jsonData.status?.lastScanResult),
      });
    }
    if (cr?.jsonData.kind === 'ImagePolicy') {
      extraInfo.push({
        name: 'Image Repository Ref',
        value:
          cr?.jsonData.spec?.imageRepositoryRef &&
          JSON.stringify(cr?.jsonData.spec?.imageRepositoryRef),
      });
      extraInfo.push({
        name: 'Policy',
        value: cr?.jsonData.spec?.policy && (
          <Editor
            theme={themeName === 'dark' ? 'vs-dark' : 'light'}
            language="yaml"
            value={YAML.stringify(cr?.jsonData.spec?.policy)}
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
      value: cr?.jsonData.spec?.suspend ? 'True' : 'False',
    });
    if (cr?.jsonData?.spec?.interval) {
      extraInfo.push({
        name: 'Interval',
        value: cr.jsonData.spec.interval,
      });
    }

    if (cr?.jsonData.kind === 'ImageUpdateAutomation') {
      extraInfo.push({
        name: 'Git',
        value: cr?.jsonData.spec?.git && (
          <Editor
            theme={themeName === 'dark' ? 'vs-dark' : 'light'}
            language="yaml"
            value={YAML.stringify(cr?.jsonData.spec?.git)}
            height={200}
            options={{
              // no lines
              lineNumbers: 'off',
            }}
          />
        ),
      });
    }

    if (!cr?.jsonData.spec?.suspend) {
      extraInfo.push({
        name: 'Next Reconciliation',
        value: <RemainingTimeDisplay item={cr} />,
      });
    }
    return extraInfo;
  }

  return (
    <>
      <MainInfoSection
        resource={cr}
        extraInfo={prepareExtraInfo()}
        actions={[
          <SyncAction resource={cr} />,
          <SuspendAction resource={cr} />,
          <ResumeAction resource={cr} />,
          <ForceReconciliationAction resource={cr} />,
        ]}
      />
      <SectionBox title="Conditions">
        <ConditionsTable resource={cr?.jsonData} />
      </SectionBox>
    </>
  );
}
