interface DeploymentContainer {
  name?: string;
  image?: string;
  command?: string[];
  args?: string[];
  env?: Array<{
    name: string;
    value?: string;
    valueFrom?: {
      fieldRef?: {
        fieldPath?: string;
      };
    };
  }>;
}

interface Deployment {
  metadata?: {
    namespace?: string;
    labels?: Record<string, string>;
  };
  spec?: {
    template?: {
      spec?: {
        containers?: DeploymentContainer[];
      };
    };
  };
}

interface DeploymentList {
  items?: Deployment[];
}

function isCertManagerController(deployment: Deployment, container: DeploymentContainer) {
  const image = container.image || '';
  const name = container.name || '';
  const labels = deployment.metadata?.labels || {};

  return (
    image.includes('cert-manager-controller') ||
    name === 'cert-manager-controller' ||
    (name === 'cert-manager' &&
      labels['app.kubernetes.io/name'] === 'cert-manager' &&
      labels['app.kubernetes.io/component'] === 'controller')
  );
}

function resolveArgumentValue(
  value: string,
  deployment: Deployment,
  container: DeploymentContainer
) {
  const env = new Map(
    (container.env || []).map(variable => {
      if (variable.value !== undefined) {
        return [variable.name, variable.value];
      }
      if (variable.valueFrom?.fieldRef?.fieldPath === 'metadata.namespace') {
        return [variable.name, deployment.metadata?.namespace];
      }
      return [variable.name, undefined];
    })
  );

  const resolved = value.replace(/\$\(([^)]+)\)/g, (_match, variableName: string) => {
    // Preserve unknown references so a partially resolved value cannot become
    // a plausible but incorrect Secret namespace.
    return env.get(variableName) ?? `$(${variableName})`;
  });

  return resolved.length <= 63 && /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(resolved)
    ? resolved
    : undefined;
}

function getConfiguredNamespace(deployment: Deployment, container: DeploymentContainer) {
  const args = [...(container.command || []), ...(container.args || [])];
  let hasConfigFile = false;
  let configuredNamespace: string | undefined;
  let hasNamespaceFlag = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--') {
      break;
    }
    if (arg === '--config' || arg.startsWith('--config=')) {
      hasConfigFile = true;
    }

    if (arg.startsWith('--cluster-resource-namespace=')) {
      hasNamespaceFlag = true;
      configuredNamespace = resolveArgumentValue(
        arg.slice(arg.indexOf('=') + 1),
        deployment,
        container
      );
    }
    if (arg === '--cluster-resource-namespace') {
      hasNamespaceFlag = true;
      const value = args[index + 1];
      configuredNamespace =
        value && !value.startsWith('--')
          ? resolveArgumentValue(value, deployment, container)
          : undefined;
      if (value && !value.startsWith('--')) {
        index += 1;
      }
    }
  }

  if (hasNamespaceFlag) {
    return configuredNamespace;
  }
  // The controller binary defaults to kube-system. Helm supplies an explicit
  // flag, normally $(POD_NAMESPACE); a config file can override the binary default.
  return hasConfigFile ? undefined : 'kube-system';
}

export function getClusterResourceNamespace(deploymentList: DeploymentList): string | undefined {
  const controllers = (deploymentList.items || []).flatMap(deployment =>
    (deployment.spec?.template?.spec?.containers || [])
      .filter(container => isCertManagerController(deployment, container))
      .map(container => ({ deployment, container }))
  );

  if (!controllers.length) {
    return undefined;
  }

  const namespaces = controllers.map(({ deployment, container }) =>
    getConfiguredNamespace(deployment, container)
  );

  if (namespaces.some(namespace => !namespace)) {
    return undefined;
  }

  const uniqueNamespaces = new Set(namespaces);
  return uniqueNamespaces.size === 1 ? namespaces[0] : undefined;
}
