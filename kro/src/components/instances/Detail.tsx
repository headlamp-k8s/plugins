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
// embedded live instance graph + shared sub-resource watches
// (native GraphView when available, local fallback otherwise)
import LiveInstanceSections from '../../map/LiveInstanceSections';
import ViewInMapLink from '../../map/ViewInMapLink';
import { KroInstance, useInstanceClass } from '../../resources/instance';
import { ResourceGraphDefinition } from '../../resources/resourceGraphDefinition';
import { flattenSimpleSchema } from '../../resources/rgdGraph';
import { KroStateLabel } from '../resourcegraphdefinitions/common';

/**
 * Build the "Spec" section: the instance's spec flattened to dot-path
 * rows.
 *
 * @param instance - The instance being displayed.
 * @returns A DetailsGrid section, or null when the spec is empty.
 */
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

/**
 * Build the conditions section from the instance's status conditions.
 *
 * @param instance - The instance being displayed.
 * @returns A DetailsGrid section, or null when there are no conditions.
 */
function getConditionsSection(instance: KubeObject<KroInstance>) {
  if (!instance.jsonData.status?.conditions?.length) {
    return null;
  }
  return {
    id: 'kro-instance-conditions',
    section: <ConditionsSection resource={instance.jsonData} />,
  };
}

/**
 * Collect scalar status fields (the RGD's CEL-projected values, e.g.
 * endpoint or readyReplicas) as name/value rows for the info card.
 * Conditions and state are excluded — they render elsewhere.
 *
 * @param instance - The instance being displayed.
 * @returns Name/value rows for MainInfoSection's extraInfo.
 */
function getStatusInfoRows(instance: KubeObject<KroInstance>) {
  const status = instance.jsonData.status ?? {};
  return Object.entries(status)
    .filter(
      ([key, value]) =>
        key !== 'conditions' && key !== 'state' && (typeof value !== 'object' || value === null)
    )
    .map(([key, value]) => ({ name: key, value: String(value ?? '-') }));
}

/**
 * Detail page for one instance of an RGD-generated API. Route params
 * supply the RGD name plus the instance namespace/name; the instance
 * class is discovered from the generated CRD, and the page degrades
 * with a message when the RGD or CRD cannot be loaded.
 *
 * @returns The instance detail view.
 */
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
              // live graph + sub-resources from one watch set
              {
                id: 'kro-instance-live',
                section: <LiveInstanceSections rgd={rgd} instance={instance} />,
              },
              getSpecSection(instance),
            ].filter(Boolean)
          : []
      }
    />
  );
}
