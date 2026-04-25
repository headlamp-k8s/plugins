import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { DateLabel, Link } from '@kinvolk/headlamp-plugin/lib/components/common';
import type { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { Base64 } from 'js-base64';
import React from 'react';
import Table from '../common/Table';
import { PluralName } from '../helpers/pluralName';

/**
 * Displays a table of resources deployed by a Helm chart.
 *
 * @param {Object} props - The properties for the component.
 * @param {string} props.name - The name of the Helm chart.
 * @param {string} props.namespace - The namespace of the Helm chart.
 *
 * The component fetches secrets related to the Helm chart, decodes the release data,
 * and extracts the resource kinds from the templates. It then fetches the resources
 * for each kind and displays them in a table with columns for name, namespace, kind,
 * readiness status, and age.
 */
export function HelmInventory(props: Readonly<{ name: string; namespace: string }>) {
  const { name: chartName, namespace } = props;
  const [resources, setResources] = React.useState([]);

  // Fetch the secrets for the helm chart
  const [secrets] = K8s.ResourceClasses.Secret.useList({
    namespace,
    labelSelector: `name=${chartName},owner=helm`,
  });

  // Query the deployed resources for the helm chart.
  // First make a list of resource kinds which are deployed by this helm chart:
  // - decode the `release` from the helm secret (double base64), unzip it, next parse with json to get the templates
  // - for each template get the resource kind and put it in a list
  // Finally fetch the resources for each kind, using labelselector for the chart
  React.useEffect(() => {
    if (secrets?.length > 0) {
      const secret = getLatestSecret(secrets);
      const releaseData = secret.data.release;
      const b64dk8s = Base64.decode(releaseData);
      const b64dhelm = Buffer.from(b64dk8s, 'base64');
      const cs = new DecompressionStream('gzip');
      const writer = cs.writable.getWriter();
      writer.write(b64dhelm);
      writer.close();

      new Response(cs.readable)
        .arrayBuffer()
        .then(function (arrayBuffer) {
          return new TextDecoder().decode(arrayBuffer);
        })
        .then(data => {
          const helmData = JSON.parse(data);
          const resourceKinds = helmData.chart.templates.map(template =>
            parseHelmTemplate(template)
          );
          const filteredResourceKinds = [];
          for (const resourceKind of resourceKinds) {
            if (
              resourceKind.kind &&
              resourceKind.apiVersion &&
              !filteredResourceKinds.find(
                item =>
                  item.kind === resourceKind.kind && item.apiVersion === resourceKind.apiVersion
              )
            ) {
              filteredResourceKinds.push(resourceKind);
            }
          }

          fetchResources(filteredResourceKinds, chartName, namespace).then(data => {
            setResources(data);
          });
        });
    }
  }, [secrets]);

  return (
    <Table
      data={Array.from(resources)}
      columns={[
        {
          header: 'Name',
          accessorKey: 'metadata.name',
          Cell: ({ row: { original: item } }) => inventoryNameLink(item),
        },
        {
          header: 'Namespace',
          accessorFn: item => item.metadata?.namespace ?? '',
          Cell: ({ cell }) => {
            if (cell.getValue())
              return (
                <Link
                  routeName="namespace"
                  params={{
                    name: cell.getValue(),
                  }}
                >
                  {cell.getValue()}
                </Link>
              );
          },
        },
        {
          header: 'Kind',
          accessorFn: item => item.kind,
        },
        {
          header: 'Ready',
          accessorFn: item => {
            if (item.status) {
              return item.status.conditions?.findIndex(
                c => c.type === 'Ready' || c.type === 'Available' || c.type === 'NamesAccepted'
              ) !== -1
                ? 'True'
                : 'False';
            }
            return '';
          },
        },
        {
          header: 'Age',
          accessorFn: item => {
            if (item.metadata.creationTimestamp) {
              return <DateLabel date={item.metadata?.creationTimestamp} />;
            }
          },
        },
      ]}
    />
  );
}

/**
 * Retrieves the latest Helm secret based on the version label.
 *
 * Iterates over an array of secret objects and determines the latest secret
 * by comparing the version label (`metadata.labels.version`) of each secret.
 * The secret with the highest version number is returned.
 *
 * @param secrets - An array of secret objects, each containing metadata with a version label.
 * @returns The secret object with the highest version number, or null if no secrets are provided.
 */
function getLatestSecret(secrets) {
  let latestSecret = null;
  let latestVersion = -1;

  for (const secret of secrets) {
    const version = parseInt(secret.metadata.labels.version, 10);

    if (version > latestVersion) {
      latestSecret = secret;
      latestVersion = version;
    }
  }

  return latestSecret;
}

/**
 * Parses a Helm template string and returns an object with the following properties:
 * - `kind`: The kind of resource the template will create.
 * - `apiVersion`: The API version of the resource.
 * - `hasNamespace`: A boolean indicating whether the resource has a namespace.
 *
 * The Helm template string is expected to contain a GoLang template for a YAML document with the
 * standard Kubernetes metadata  fields. The function returns the first
 * occurrence of each of the above properties. If the properties are not found,
 * the function returns an object with empty strings for `kind` and `apiVersion`,
 * and `false` for `hasNamespace`.
 *
 * @param template A Helm template string encoded in base64.
 * @returns An object with the kind, apiVersion, and hasNamespace of the resource.
 */
function parseHelmTemplate(template): {
  kind: string;
  apiVersion: string;
  hasNamespace: boolean;
} {
  const decodedTemplate = Base64.decode(template.data);
  const lines = decodedTemplate.split(/\r?\n/);

  let apiVersion = '';
  let kind = '';
  let hasNamespace = false;
  let isParsingMetadata = false;

  for (const line of lines) {
    if (line.startsWith('apiVersion: ')) {
      apiVersion = apiVersion || line.replace('apiVersion: ', '');
    } else if (line.startsWith('kind: ')) {
      kind = kind || line.replace('kind: ', '');
    } else if (line.startsWith('metadata:')) {
      isParsingMetadata = true;
    } else if (isParsingMetadata) {
      if (line.includes('namespace: ')) {
        hasNamespace = true;
        break;
      } else if (!line.startsWith(' ')) {
        break;
      }
    }
  }

  return { kind, apiVersion, hasNamespace };
}

/**
 * Fetches Kubernetes resources associated with a Helm release using the specified resource kinds, chart name, and namespace.
 * Constructs API requests for each resource kind, appending a label selector for the Helm chart name and namespace.
 * Adds metadata including kind, API version, and group name to each resource for further processing.
 * Logs a message if no resources of a kind are found or an error occurs.
 *
 * @param {Array<{ kind: string, apiVersion: string, hasNamespace: boolean }>} resourceKinds - Array of resource kind objects containing kind, apiVersion, and hasNamespace properties.
 * @param {string} chartName - The name of the Helm chart.
 * @param {string} namespace - The namespace in which the Helm chart is deployed.
 * @returns {Promise<Array<HelmResourceKind>>} - A promise that resolves to an array of fetched resources with additional metadata.
 */

interface HelmResourceKind extends KubeObjectInterface {
  groupName: string;
}

async function fetchResources(
  resourceKinds,
  chartName: string,
  namespace: string
): Promise<Array<HelmResourceKind>> {
  const resources = [];

  const queryParams = new URLSearchParams();
  queryParams.append(
    'labelSelector',
    `helm.toolkit.fluxcd.io/name=${chartName},helm.toolkit.fluxcd.io/namespace=${namespace}`
  );

  for (const resourceKind of resourceKinds) {
    const { kind, apiVersion, hasNamespace } = resourceKind;

    const groupName = apiVersion.includes('/') ? apiVersion.split('/')[0] : '';
    const version = apiVersion.split('/').slice(-1)[0];
    const pluralName = PluralName(kind);

    const api = groupName ? `/apis/${groupName}` : '/api';
    const namespaceFilter = hasNamespace ? `namespaces/${namespace}/` : '';

    request(`${api}/${version}/${namespaceFilter}${pluralName}?${queryParams.toString()}`)
      .then(response => {
        response.items.forEach(item => {
          resources.push({ ...item, kind, apiVersion, groupName }); // add kind, apiVersion, groupName for link
        });
      })
      .catch(error => {
        if (error.status === 404) {
          console.log(`No ${pluralName} found for chart ${chartName}`);
        } else {
          console.error(error);
        }
      });
  }

  return resources;
}

/**
 * Returns a link to the specified resource, using the correct route name and
 * parameters depending on the resource's kind and group name.
 *
 * @param {Object} item - A Kubernetes resource object.
 * @returns {React.ReactNode} - A link to the resource.
 */
function inventoryNameLink(item: HelmResourceKind): React.ReactNode {
  const kind = item.kind;
  const groupName = item.groupName;
  const pluralName = PluralName(kind);

  // Flux types
  const allowedDomain = 'toolkit.fluxcd.io';
  if (groupName === allowedDomain || groupName.endsWith(`.${allowedDomain}`)) {
    const routeName =
      groupName === allowedDomain ? 'toolkit' : groupName.substring(0, groupName.indexOf('.'));

    return (
      <Link
        routeName={routeName}
        params={{
          pluralName: pluralName,
          name: item.metadata.name,
          namespace: item.metadata.namespace,
        }}
      >
        {item.metadata.name}
      </Link>
    );
  }

  // Standard k8s types
  const resourceClass = K8s.ResourceClasses[kind];
  if (resourceClass) {
    const resource = new resourceClass(item);
    if (resource?.getDetailsLink?.()) {
      return <Link kubeObject={resource}>{item.metadata.name}</Link>;
    }
    return item.metadata.name;
  }

  // Custom resources
  return (
    <Link
      routeName="customresource"
      params={{
        crName: item.metadata.name,
        crd: `${pluralName}.${groupName}`,
        namespace: item.metadata.namespace || '-',
      }}
    >
      {item.metadata.name}
    </Link>
  );
}
