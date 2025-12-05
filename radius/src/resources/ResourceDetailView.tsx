import { Icon } from '@iconify/react';
import { Link, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button, Chip, CircularProgress, Grid, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { UCPResource, useRadiusResources } from '../models/radius';

interface RouteParams {
  resourceName: string;
  [key: string]: string | undefined;
}

/**
 * Resource Detail View Component
 * Shows detailed information about a specific Radius resource
 */
export default function ResourceDetailView() {
  const { resourceName } = useParams<RouteParams>();
  const [resources, error, loading] = useRadiusResources();

  // Show loading state
  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '400px',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  // Show error state
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          Error loading resource
        </Typography>
        <Typography color="error">{error.message}</Typography>
      </Box>
    );
  }

  // Find the selected resource
  const resource: UCPResource | undefined = resources?.find(res => res.name === resourceName);

  // Resource not found
  if (!resource) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Resource Not Found
        </Typography>
        <Typography color="textSecondary" gutterBottom>
          The resource "{resourceName}" could not be found.
        </Typography>
        <Button
          onClick={() => window.history.back()}
          startIcon={<Icon icon="mdi:arrow-left" />}
          sx={{ mt: 2 }}
        >
          Back
        </Button>
      </Box>
    );
  }

  const resourceType = resource.type.split('/').pop() || resource.type;
  const applicationName = resource.properties.application?.split('/').pop();
  const environmentName = resource.properties.environment?.split('/').pop();

  // Check if this is a container resource with Kubernetes compute information
  const isContainer = resource.type === 'Applications.Core/containers';
  const computeStatus = resource.properties.status?.compute as any;
  const computeNamespace = computeStatus?.namespace;

  let k8sResourceName: string | undefined;
  let k8sResourceType: 'deployment' | 'pod' | undefined;

  // Check for resource property which might contain the K8s resource name
  if (isContainer && resource.properties.resource) {
    k8sResourceName = (resource.properties.resource as Record<string, any>)?.name || resource.name;
    k8sResourceType = 'deployment'; // Containers typically map to deployments
  } else if (isContainer && computeStatus?.resourceId) {
    // Try to parse resourceId if it exists
    const resourceId = computeStatus.resourceId as string;
    const idParts = resourceId.split('/');
    const typeIndex = idParts.findIndex(
      part =>
        part.toLowerCase() === 'deployment' ||
        part.toLowerCase() === 'deployments' ||
        part.toLowerCase() === 'pods'
    );
    if (typeIndex >= 0 && typeIndex + 1 < idParts.length) {
      const typePart = idParts[typeIndex].toLowerCase();
      k8sResourceType = typePart.includes('deployment') ? 'deployment' : 'pod';
      k8sResourceName = idParts[typeIndex + 1];
    }
  } else if (isContainer) {
    // Fallback: use the container name as the deployment name
    k8sResourceName = resource.name;
    k8sResourceType = 'deployment';
  }

  return (
    <Box>
      {/* Header with Back Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          onClick={() => window.history.back()}
          startIcon={<Icon icon="mdi:arrow-left" />}
          sx={{ mb: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" gutterBottom>
          {resource.name}
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {resource.id}
        </Typography>
      </Box>

      {/* Content */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SectionBox title="General Information">
            <Box display="flex" flexDirection="column" gap={2}>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Name
                </Typography>
                <Typography variant="body1">{resource.name}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Type
                </Typography>
                <Chip label={resourceType} size="small" />
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Full Type
                </Typography>
                <Typography variant="body2">{resource.type}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Location
                </Typography>
                <Typography variant="body1">{resource.location}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="textSecondary">
                  Provisioning State
                </Typography>
                <Chip
                  label={resource.properties.provisioningState || 'Unknown'}
                  color={
                    resource.properties.provisioningState === 'Succeeded' ? 'success' : 'default'
                  }
                  size="small"
                />
              </Box>
            </Box>
          </SectionBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SectionBox title="Application & Environment">
            <Box display="flex" flexDirection="column" gap={2}>
              {applicationName && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Application
                  </Typography>
                  <Link routeName="application-detail" params={{ applicationName }}>
                    {applicationName}
                  </Link>
                </Box>
              )}
              {environmentName && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Environment
                  </Typography>
                  <Link routeName="environment-detail" params={{ environmentName }}>
                    {environmentName}
                  </Link>
                </Box>
              )}
              {resource.properties.status?.compute?.kind && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Compute Kind
                  </Typography>
                  <Typography variant="body1">{resource.properties.status.compute.kind}</Typography>
                </Box>
              )}
              {resource.properties.status?.compute?.namespace && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary">
                    Namespace
                  </Typography>
                  <Typography variant="body1">
                    {resource.properties.status.compute.namespace}
                  </Typography>
                </Box>
              )}
              {isContainer && k8sResourceName && k8sResourceType && computeNamespace && (
                <Box>
                  <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                    Kubernetes Resource
                  </Typography>
                  <Button
                    component={Link}
                    routeName={k8sResourceType}
                    params={{
                      namespace: computeNamespace,
                      name: k8sResourceName,
                    }}
                    startIcon={<Icon icon="mdi:kubernetes" />}
                    variant="outlined"
                    size="small"
                  >
                    View {k8sResourceType === 'deployment' ? 'Deployment' : 'Pod'}
                  </Button>
                </Box>
              )}
            </Box>
          </SectionBox>
        </Grid>

        {/* Display additional properties if they exist */}
        {Object.keys(resource.properties).length > 4 && (
          <Grid item xs={12}>
            <SectionBox title="Additional Properties">
              <Box display="flex" flexDirection="column" gap={1.5}>
                {Object.entries(resource.properties)
                  .filter(
                    ([key]) =>
                      !['application', 'environment', 'provisioningState', 'status'].includes(key)
                  )
                  .map(([key, value]) => (
                    <Box key={key}>
                      <Typography variant="subtitle2" color="textSecondary">
                        {key}
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </Typography>
                    </Box>
                  ))}
              </Box>
            </SectionBox>
          </Grid>
        )}

        {resource.systemData && (
          <Grid item xs={12}>
            <SectionBox title="System Information">
              <Grid container spacing={2}>
                {resource.systemData.createdAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Created At
                    </Typography>
                    <Typography variant="body2">
                      {new Date(resource.systemData.createdAt).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                {resource.systemData.createdBy && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Created By
                    </Typography>
                    <Typography variant="body2">{resource.systemData.createdBy}</Typography>
                  </Grid>
                )}
                {resource.systemData.lastModifiedAt && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Last Modified
                    </Typography>
                    <Typography variant="body2">
                      {new Date(resource.systemData.lastModifiedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                {resource.systemData.lastModifiedBy && (
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="textSecondary">
                      Last Modified By
                    </Typography>
                    <Typography variant="body2">{resource.systemData.lastModifiedBy}</Typography>
                  </Grid>
                )}
              </Grid>
            </SectionBox>
          </Grid>
        )}

        {resource.tags && Object.keys(resource.tags).length > 0 && (
          <Grid item xs={12}>
            <SectionBox title="Tags">
              <Box display="flex" flexWrap="wrap" gap={1}>
                {Object.entries(resource.tags).map(([key, value]) => (
                  <Chip key={key} label={`${key}: ${value}`} variant="outlined" size="small" />
                ))}
              </Box>
            </SectionBox>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
