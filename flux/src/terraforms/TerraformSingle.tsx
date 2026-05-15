import { ConditionsSection, DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
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

export function TerraformDetailView(props: { name?: string; namespace?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { name = params.name, namespace = params.namespace } = props;

  return (
    <DetailsGrid
      resourceType={Terraform}
      name={name}
      namespace={namespace}
      withEvents
      actions={resource => {
        if (!resource) return [];
        return [
          <SyncWithSourceAction key="sync" resource={resource} />,
          <SyncWithoutSourceAction key="sync-without-source" resource={resource} />,
          <SuspendAction key="suspend" resource={resource} />,
          <ResumeAction key="resume" resource={resource} />,
        ];
      }}
      extraInfo={resource => {
        if (!resource) return [];
        return [
          { name: 'Status', value: <StatusLabel item={resource} /> },
          { name: 'Source', value: resource.jsonData?.spec?.sourceRef?.name },
          { name: 'Path', value: resource.jsonData?.spec?.path },
          { name: 'Workspace', value: resource.jsonData?.spec?.workspace },
          { name: 'Interval', value: resource.jsonData?.spec?.interval },
          { name: 'Suspend', value: resource.jsonData?.spec?.suspend ? 'True' : 'False' },
        ];
      }}
      extraSections={resource => {
        if (!resource) return [];
        return [
          {
            id: 'flux.terraform-conditions',
            section: <ConditionsSection resource={resource.jsonData} />,
          },
        ];
      }}
    />
  );
}
