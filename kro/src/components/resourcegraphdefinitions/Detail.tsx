import {
  ConditionsSection,
  DetailsGrid,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import ViewInMapLink from '../../map/ViewInMapLink';
import { ResourceGraphDefinition } from '../../resources/resourceGraphDefinition';
import {
  ComposedResource,
  flattenSimpleSchema,
  getComposedResources,
} from '../../resources/rgdGraph';
import InstancesSection from '../instances/InstancesSection';
import { KroStateLabel } from './common';

function getComposedResourcesSection(rgd: ResourceGraphDefinition) {
  const resources = getComposedResources(rgd.jsonData);
  if (resources.length === 0) {
    return null;
  }
  return {
    id: 'kro-composed-resources',
    section: (
      <SectionBox title="Composed Resources">
        <SimpleTable
          columns={[
            {
              label: 'ID',
              getter: (resource: ComposedResource) => resource.id,
            },
            {
              label: 'Kind',
              getter: (resource: ComposedResource) =>
                resource.external ? `${resource.kind} (external, read-only)` : resource.kind,
            },
            {
              label: 'API Version',
              getter: (resource: ComposedResource) => resource.apiVersion,
            },
            {
              label: 'Depends On',
              getter: (resource: ComposedResource) => resource.dependencies.join(', ') || '-',
            },
            {
              label: 'Conditional',
              getter: (resource: ComposedResource) => (resource.conditional ? 'Yes' : ''),
            },
          ]}
          data={resources}
        />
      </SectionBox>
    ),
  };
}

function getSchemaSection(rgd: ResourceGraphDefinition) {
  const specFields = flattenSimpleSchema(rgd.spec.schema?.spec);
  const statusFields = flattenSimpleSchema(rgd.spec.schema?.status);
  if (specFields.length === 0 && statusFields.length === 0) {
    return null;
  }
  return {
    id: 'kro-schema',
    section: (
      <SectionBox title="Schema">
        <SimpleTable
          columns={[
            { label: 'Field', getter: row => row.path },
            { label: 'Definition', getter: row => row.definition },
            { label: 'Role', getter: row => row.role },
          ]}
          data={[
            ...specFields.map(field => ({ ...field, role: 'spec' })),
            ...statusFields.map(field => ({ ...field, role: 'status' })),
          ]}
        />
      </SectionBox>
    ),
  };
}

function getConditionsSection(rgd: ResourceGraphDefinition) {
  if (!rgd.status.conditions?.length) {
    return null;
  }
  return {
    id: 'kro-conditions',
    section: <ConditionsSection resource={rgd.jsonData} />,
  };
}

export default function ResourceGraphDefinitionDetail() {
  const { name } = useParams<{ name: string }>();

  return (
    <DetailsGrid
      resourceType={ResourceGraphDefinition}
      name={name}
      withEvents
      extraInfo={(rgd: ResourceGraphDefinition | null) =>
        rgd && [
          {
            name: 'State',
            value: <KroStateLabel state={rgd.state} />,
          },
          {
            name: 'Generated Kind',
            value: rgd.generatedKind,
          },
          {
            name: 'Generated API Version',
            value: rgd.generatedApiVersion,
          },
          {
            name: 'Map',
            value: <ViewInMapLink nodeId={rgd.metadata.uid} />,
          },
        ]
      }
      extraSections={(rgd: ResourceGraphDefinition | null) =>
        rgd
          ? [
              getConditionsSection(rgd),
              {
                id: 'kro-instances',
                section: <InstancesSection rgd={rgd} />,
              },
              getComposedResourcesSection(rgd),
              getSchemaSection(rgd),
            ].filter(Boolean)
          : []
      }
    />
  );
}
