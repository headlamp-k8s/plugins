import { K8s } from '@kinvolk/headlamp-plugin/lib';
import Event from '@kinvolk/headlamp-plugin/lib/k8s/event';
import { apiFactory } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import React from 'react';
import { useLocation } from 'react-router';
import {
  ConditionsTable,
  DateLabel,
  MainInfoSection,
  SectionBox,
  ShowHideLabel,
  Table,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { SuspendAction, ResumeAction, SyncAction } from '../actions/index';
import YAML from 'yaml';
import Editor from '@monaco-editor/react';

const fluxImageInfo = {
  imagerepositories: {
    kind: 'ImageRepository',
    type: 'imagerepositories.image.toolkit.fluxcd.io'
  },
  imagepolicies: {
    kind: 'ImagePolicy',
    type: 'imagepolicies.image.toolkit.fluxcd.io'
  },
  imageupdateautomations: {
    kind: 'ImageUpdateAutomation',
    type: 'imageupdateautomations.image.toolkit.fluxcd.io'
  }
}

export function FluxImageAutomationDetailView() {
  const location = useLocation();
  const segments = location.pathname.split('/');
  const [namespace, type, name] = segments.slice(-3)

  function getType() {
    return fluxImageInfo[type].type;
  }

  function getKind() {
    return fluxImageInfo[type].kind;
  }

  const CRD = K8s.ResourceClasses.CustomResourceDefinition;
  CRD.apiEndpoint = apiFactory(
    ['apiextensions.k8s.io', 'v1', 'customresourcedefinitions'],
    ['apiextensions.k8s.io', 'v1beta1', 'customresourcedefinitions'],
    ['apiextensions.k8s.io', 'v1beta2', 'customresourcedefinitions']
  );
  const [events, error] = Event?.default.objectEvents({
    namespace: namespace,
    name: name,
    kind: getKind(),
  });

  const [resource] = CRD.useGet(getType());
  return (
    <>
      {resource && <CustomResourceDetails resource={resource} name={name} namespace={namespace} />}
      <SectionBox title="Events">
        <Table
          data={events}
          columns={[
            {
              header: 'Type',
              accessorFn: item => item.type,
            },
            {
              header: 'Reason',
              accessorFn: item => item.reason,
            },
            {
              header: 'Age',
              accessorFn: item => (
                <DateLabel date={new Date(item.jsonData.lastTimestamp).getTime()} />
              ),
            },
            {
              header: 'From',
              accessorFn: item => item.jsonData.reportingComponent || '-',
            },
            {
              header: 'Message',
              accessorFn: item => (
                <ShowHideLabel labelId={item?.metadata?.uid || ''}>
                  {item.message || ''}
                </ShowHideLabel>
              ),
            },
          ]}
        />
      </SectionBox>
    </>
  );
}

function CustomResourceDetails(props) {
  const { name, namespace, resource } = props;
  const [cr, setCr] = React.useState(null);
  const resourceClass = React.useMemo(() => {
    return resource.makeCRClass();
  }, [resource]);

  resourceClass.useApiGet(setCr, name, namespace);

  function prepareExtraInfo() {
    const extraInfo = [];

    if (cr?.jsonData.kind === 'ImageRepository') {
      extraInfo.push({
        name: 'Image',
        value: cr?.jsonData.spec?.image,
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
        value: cr?.jsonData.status?.canonicalImageName || '-',
      });
      extraInfo.push({
        name: 'Last Scan Result',
        value:
          cr?.jsonData.status?.lastScanResult &&
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
        ]}
      />
      <SectionBox title="Conditions">
        <ConditionsTable resource={cr?.jsonData} />
      </SectionBox>
    </>
  );
}
