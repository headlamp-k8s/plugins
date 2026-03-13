import {
  ConditionsSection,
  DetailsGrid,
  EmptyContent,
  HoverInfoLabel,
  Link,
  Loader,
  NameValueTableRow,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { localeDate } from '@kinvolk/headlamp-plugin/lib/Utils';
import { JSONPath } from 'jsonpath-plus';
import { useParams } from 'react-router';
import { Machine } from '../../resources/machine';

function getMachineCrdName(): string {
  const group = Machine.apiVersion.split('/')[0];
  return `${Machine.apiName}.${group}`;
}

type AdditionalPrinterColumns = Array<{
  name: string;
  type: string;
  jsonPath: string;
  description?: string;
  priority?: number;
  format?: string;
}>;


function getExtraColumns(
  crd: CustomResourceDefinition,
  apiVersion: string
): AdditionalPrinterColumns {
  const spec = (crd.jsonData as { spec?: { versions?: Array<{ name: string; additionalPrinterColumns?: AdditionalPrinterColumns }> } })?.spec;
  const versions = spec?.versions ?? [];
  const version = versions.find(v => v.name === apiVersion);
  const columns = version?.additionalPrinterColumns ?? [];
  if (columns.length > 0) return columns;
  const firstWithColumns = versions.find(v => (v.additionalPrinterColumns?.length ?? 0) > 0);
  return firstWithColumns?.additionalPrinterColumns ?? [];
}

function getExtraInfo(
  extraInfoSpec: AdditionalPrinterColumns,
  item: Record<string, unknown>
) {
  const extraInfo: NameValueTableRow[] = [];
  extraInfoSpec.forEach(spec => {
    if (spec.jsonPath === '.metadata.creationTimestamp') {
      return;
    }

    let value: string | undefined;
    try {
      value = JSONPath({ path: '$' + spec.jsonPath, json: item });
    } catch (err) {
      console.error(`Failed to get value from JSONPath ${spec.jsonPath} on CR item ${item}`);
      return;
    }
    if (spec.type === 'date' && !!value) {
      value = localeDate(new Date(value));
    } else {
      value = value?.toString();
    }
    const desc = spec.description;

    extraInfo.push({
      name: spec.name,
      value: !!desc ? <HoverInfoLabel label={value || ''} hoverInfo={desc} /> : value,
      hide: value === '' || value === undefined,
    });
  });

  return extraInfo;
}

export function MachineDetail({ node }: { node?: any }) {
  const { name: nameParam, namespace: namespaceParam } = useParams<{ name: string; namespace: string }>();
  const crdName = getMachineCrdName();
  const crName = nameParam || node?.kubeObject?.metadata?.name;
  const namespace = namespaceParam || node?.kubeObject?.metadata?.namespace;

  const [crd, crdError] = CustomResourceDefinition.useGet(crdName, undefined);
  const [item, itemError] = Machine.useGet(crName || '', namespace || undefined);

  const apiVersion = item?.jsonData?.apiVersion?.split('/')[1] ?? '';
  const extraColumns = crd ? getExtraColumns(crd, apiVersion) : [];

  const getMachineRole = (data: Machine) => {
    const owners = data?.metadata?.ownerReferences ?? [];
    const isControlPlane = owners.some(
      (ref: { kind?: string }) => ref.kind === 'KubeadmControlPlane'
    );
    return isControlPlane ? 'Control Plane' : 'Worker';
  };
  if (!crName) {
    return <EmptyContent color="error">Missing resource name</EmptyContent>;
  }

  if (crdError && !crd) {
    return (
      <EmptyContent color="error">
        Error loading Machine: {crdError.message}
      </EmptyContent>
    );
  }

  if (!crd) {
    return <Loader title="Loading Machine" />;
  }

  if (itemError && !item) {
    return (
      <EmptyContent color="error">
        Error loading Machine {crName}: {itemError?.message}
      </EmptyContent>
    );
  }

  if (!item) {
    return <Loader title="Loading Machine details" />;
  }

  const data = item.jsonData as Record<string, unknown>;

  return (
    <DetailsGrid
      resourceType={Machine}
      withEvents
      name={crName}
      namespace={namespace || undefined}
      extraInfo={[
        {
          name: 'Definition',
          value: (
            <Link routeName="crd" params={{ name: crdName }}>
              {crdName}
            </Link>
          ),
        },
        {
          name: 'Role',
          value: getMachineRole(item),
        },
        ...getExtraInfo(extraColumns, data),
      ]}
      extraSections={() => [
        {
          id: 'cluster-api.machine-conditions',
          section: <ConditionsSection resource={item.jsonData} />,
        },
      ]}
    />
  );
}
