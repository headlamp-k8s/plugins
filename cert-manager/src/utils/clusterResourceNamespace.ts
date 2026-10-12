interface DeploymentContainer {
  name?: string;
  image?: string;
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
        return [variable.name, deployment.metadata?.namespace || ''];
      }
      return [variable.name, ''];
    })
  );

  const resolved = value.replace(/\$\(([^)]+)\)/g, (_match, variableName: string) => {
    return env.get(variableName) || '';
  });

  return resolved && !resolved.includes('$(') ? resolved : undefined;
}

function getConfiguredNamespace(deployment: Deployment, container: DeploymentContainer) {
  const args = container.args || [];
  let hasConfigFile = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--config' || arg.startsWith('--config=')) {
      hasConfigFile = true;
    }

    if (arg.startsWith('--cluster-resource-namespace=')) {
      return resolveArgumentValue(arg.split('=').slice(1).join('='), deployment, container);
    }
    if (arg === '--cluster-resource-namespace') {
      const value = args[index + 1];
      return value && !value.startsWith('--')
        ? resolveArgumentValue(value, deployment, container)
        : undefined;
    }
  }

  // A controller config file can override this setting, so don't guess its value.
  // Otherwise cert-manager's documented default cluster resource namespace is "cert-manager".
  return hasConfigFile ? undefined : 'cert-manager';
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
