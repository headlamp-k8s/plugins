import {
  ConditionsSection,
  DetailsGrid,
  EmptyContent,
  Loader,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { useParams } from 'react-router-dom';
import ViewInMapLink from '../../map/ViewInMapLink';
import { KroInstance, useInstanceClass } from '../../resources/instance';
import { ResourceGraphDefinition } from '../../resources/resourceGraphDefinition';
import { flattenSimpleSchema } from '../../resources/rgdGraph';
import { KroStateLabel } from '../resourcegraphdefinitions/common';
import SubResourcesSection from './SubResourcesSection';

function getSpecSection(instance: KubeObject<KroInstance>) {
  const fields = flattenSimpleSchema(instance.jsonData.spec);
  if (fields.length === 0) {
    return null;
  }
  return {
    id: 'kro-instance-spec',
    section: (
      <SectionBox title="Spec">
        <NameValueTable
          rows={fields.map(field => ({ name: field.path, value: field.definition }))}
        />
      </SectionBox>
    ),
  };
}

function getConditionsSection(instance: KubeObject<KroInstance>) {
  if (!instance.jsonData.status?.conditions?.length) {
    return null;
  }
  return {
    id: 'kro-instance-conditions',
    section: <ConditionsSection resource={instance.jsonData} />,
  };
}

function getStatusInfoRows(instance: KubeObject<KroInstance>) {
  const status = instance.jsonData.status ?? {};
  return Object.entries(status)
    .filter(
      ([key, value]) =>
        key !== 'conditions' && key !== 'state' && (typeof value !== 'object' || value === null)
    )
    .map(([key, value]) => ({ name: key, value: String(value ?? '-') }));
}

export default function InstanceDetail() {
  const { rgdName, namespace, name } = useParams<{
    rgdName: string;
    namespace?: string;
    name: string;
  }>();
  const [rgd, rgdError] = ResourceGraphDefinition.useGet(rgdName);
  const { instanceClass, error: crdError, isLoading } = useInstanceClass(rgd);

  if (rgdError) {
    return (
      <SectionBox title={name}>
        <EmptyContent>
          Unable to load ResourceGraphDefinition {rgdName}: {rgdError.message}
        </EmptyContent>
      </SectionBox>
    );
  }
  if (crdError) {
    return (
      <SectionBox title={name}>
        <EmptyContent>Unable to discover the generated CRD: {crdError.message}</EmptyContent>
      </SectionBox>
    );
  }
  if (isLoading || !rgd || !instanceClass) {
    return <Loader title="Loading instance API" />;
  }

  return (
    <DetailsGrid
      resourceType={instanceClass}
      name={name}
      namespace={namespace}
      withEvents
      extraInfo={(instance: KubeObject<KroInstance> | null) =>
        instance && [
          {
            name: 'State',
            value: <KroStateLabel state={instance.jsonData.status?.state} />,
          },
          {
            name: 'API',
            value: instanceClass.apiVersion,
          },
          {
            name: 'Map',
            value: <ViewInMapLink nodeId={instance.metadata.uid} />,
          },
          ...getStatusInfoRows(instance),
        ]
      }
      extraSections={(instance: KubeObject<KroInstance> | null) =>
        instance
          ? [
              getConditionsSection(instance),
              {
                id: 'kro-instance-subresources',
                section: <SubResourcesSection rgd={rgd} instance={instance} />,
              },
              getSpecSection(instance),
            ].filter(Boolean)
          : []
      }
    />
  );
}
