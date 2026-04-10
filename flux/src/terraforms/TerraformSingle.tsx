import {
  ConditionsTable,
  MainInfoSection,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import React from 'react';
import { useParams } from 'react-router-dom';
import {
  ResumeAction,
  SuspendAction,
  SyncWithoutSourceAction,
  SyncWithSourceAction,
} from '../actions/index';
import { Terraform } from '../common/Resources';
import StatusLabel from '../common/StatusLabel';
import { ObjectEvents } from '../helpers/index';

export function TerraformDetailView(props: { name?: string; namespace?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { name = params.name, namespace = params.namespace } = props;
  const [cr] = Terraform.useGet(name, namespace);

  function prepareExtraInfo() {
    if (!cr) return [];
    return [
      { name: 'Status', value: <StatusLabel item={cr} /> },
      { name: 'Source', value: cr?.jsonData?.spec?.sourceRef?.name },
      { name: 'Path', value: cr?.jsonData?.spec?.path },
      { name: 'Workspace', value: cr?.jsonData?.spec?.workspace },
      { name: 'Interval', value: cr?.jsonData?.spec?.interval },
      { name: 'Suspend', value: cr?.jsonData?.spec?.suspend ? 'True' : 'False' },
    ];
  }

  function prepareActions() {
    if (!cr) return [];
    return [
      <SyncWithSourceAction key="sync" resource={cr} />,
      <SyncWithoutSourceAction key="sync-without-source" resource={cr} />,
      <SuspendAction key="suspend" resource={cr} />,
      <ResumeAction key="resume" resource={cr} />,
    ];
  }

  return (
    <>
      {cr && (
        <MainInfoSection resource={cr} extraInfo={prepareExtraInfo()} actions={prepareActions()} />
      )}
      <SectionBox title="Conditions">
        <ConditionsTable resource={cr?.jsonData} />
      </SectionBox>
      <ObjectEvents name={name} namespace={namespace} resourceClass={Terraform} />
    </>
  );
}
