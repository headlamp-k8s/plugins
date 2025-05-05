import { Icon } from '@iconify/react';
import { ConfirmDialog } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import Editor from '@monaco-editor/react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Typography,
} from '@mui/material';
import React from 'react';
import YAML from 'yaml';

interface ApiConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  method: string;
  url: string;
  body?: string;
  onConfirm: (editedBody?: string) => void;  // Updated to accept edited body
  isLoading?: boolean;
  result?: any;
  error?: string;
}

export default function ApiConfirmationDialog({
  open,
  onClose,
  method,
  url,
  body,
  onConfirm,
  isLoading = false,
  result,
  error,
}: ApiConfirmationDialogProps) {
  const [editedBody, setEditedBody] = React.useState('');
  const themeName = localStorage.getItem('headlampThemePreference');
  const [resourceInfo, setResourceInfo] = React.useState<{
    kind: string;
    name: string;
    namespace?: string;
  } | null>(null);
  
  // Add state for delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  React.useEffect(() => {
    if(method.toUpperCase() === 'DELETE') {
      setShowDeleteConfirm(true);
    }
    if (body) {
      try {
        // Check if this is a PATCH request with partial resource
        const processedBody = body;
        
        
          // Try parsing as JSON and convert to YAML
          try {
            const jsonObject = JSON.parse(processedBody);
            const yamlContent = YAML.stringify(jsonObject);
            setEditedBody(yamlContent);
          } catch (e) {
            // If parsing fails, use as is
            setEditedBody(processedBody);
          }
        
        // Try to extract resource information
        try {
          let parsed;
          // Try parsing as YAML first
          try {
            parsed = YAML.parse(processedBody);
          } catch (e) {
            // If YAML parsing fails, try JSON
            parsed = JSON.parse(processedBody);
          }

          if (parsed && parsed.kind && parsed.metadata && parsed.metadata.name) {
            setResourceInfo({
              kind: parsed.kind,
              name: parsed.metadata.name,
              namespace: parsed.metadata.namespace,
            });
          }
        } catch (e) {
          // If both parsing methods fail, continue without setting resourceInfo
          setResourceInfo(null);
        }
      } catch (e) {
        console.warn('Failed to parse body as JSON or YAML:', e);
        setEditedBody(body);
      }
    } else {
      setEditedBody('');
      setResourceInfo(null);
    }
  }, [body, method]);

  // Also try to extract resource info from the URL if not found in body
  React.useEffect(() => {
    if (!resourceInfo && url) {
      const urlParts = url.split('/');
      // Try to extract resource kind and name from URL
      // Format often follows: /api/v1/namespaces/{namespace}/{resourceType}/{name}
      // or /apis/{group}/{version}/namespaces/{namespace}/{resourceType}/{name}

      const nameIndex = urlParts.length - 1;
      if (nameIndex > 0) {
        const resourceTypeIndex = nameIndex - 1;
        let namespaceIndex = -1;

        // Check if URL contains namespace
        const namespacePos = urlParts.indexOf('namespaces');
        if (namespacePos >= 0 && namespacePos + 1 < urlParts.length) {
          namespaceIndex = namespacePos + 1;
        }

        if (resourceTypeIndex > 0) {
          setResourceInfo({
            kind: urlParts[resourceTypeIndex],
            name: urlParts[nameIndex],
            namespace: namespaceIndex > 0 ? urlParts[namespaceIndex] : undefined,
          });
        }
      }
    }
  }, [url, resourceInfo]);

  // Handle confirmation using clusterAction like in the example
  const handleSubmit = () => {
    // For GET requests, just call onConfirm which will use clusterRequest
    if (method.toUpperCase() === 'GET') {
      onConfirm();
      return;
    }
    
    // For DELETE operations, show confirmation dialog
    if (method.toUpperCase() === 'DELETE') {
      setShowDeleteConfirm(true);
      return;
    }
    
    // For other modifying operations, close dialog immediately and let clusterAction handle it
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      // Call onConfirm with the edited body
      onConfirm(editedBody);
      // Close dialog immediately - clusterAction will handle loading state and notifications
      onClose();
    }
  };

  // Handle delete confirmation
  const handleDeleteConfirm = () => {
    // Close the delete confirmation dialog
    setShowDeleteConfirm(false);
    // Call onConfirm to trigger the delete operation with the edited body
    onConfirm(editedBody);
    // Close the main dialog
    onClose();
  };

  const getMethodColor = () => {
    switch (method.toUpperCase()) {
      case 'GET':
        return '#4caf50'; // Green
      case 'POST':
        return '#2196f3'; // Blue
      case 'PUT':
      case 'PATCH':
        return '#ff9800'; // Orange
      default:
        return '#757575'; // Grey
    }
  };

  const getMethodIcon = () => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'mdi:database-search';
      case 'POST':
        return 'mdi:database-plus';
      case 'PUT':
      case 'PATCH':
        return 'mdi:database-edit';
      default:
        return 'mdi:database';
    }
  };

  const getTitle = () => {
    const base =
      method.toUpperCase() === 'DELETE'
        ? 'Delete'
        : method.toUpperCase() === 'POST'
        ? 'Create'
        : method.toUpperCase() === 'GET'
        ? 'Fetch'
        : 'Update';

    // Add resource info to title if available
    if (resourceInfo) {
      return `${base} ${resourceInfo.kind}: ${resourceInfo.name}`;
    }

    return `${base} Resource`;
  };

  const getConfirmButtonText = () => {
    switch (method.toUpperCase()) {
      case 'GET':
        return 'Fetch';
      case 'POST':
        return 'Create';
      case 'PUT':
      case 'PATCH':
        return 'Update';
      default:
        return 'Send Request';
    }
  };




  // Only show results for GET requests or non-modifying operations
  const shouldShowResult = result && !isLoading && method.toUpperCase() === 'GET';
  // if this is a delete request
  if(showDeleteConfirm) {
    return (
       <ConfirmDialog
       open={showDeleteConfirm}
       handleClose={() => setShowDeleteConfirm(false)}
       onConfirm={handleDeleteConfirm}
       title={`Delete ${resourceInfo?.kind || 'Resource'}`}
       description={
         <Box>
           <Typography variant="body1" sx={{ mb: 2 }}>
             {resourceInfo 
               ? `Are you sure you want to delete the ${resourceInfo.kind} "${resourceInfo.name}"${
                   resourceInfo.namespace ? ` in namespace "${resourceInfo.namespace}"` : ''
                 }?`
               : 'Are you sure you want to delete this resource?'}
           </Typography>
           {resourceInfo && (
             <Box
               sx={{
                 p: 2,
                 borderRadius: 1,
                 mb: 2,
               }}
             >
               <Typography variant="subtitle2" component="div" sx={{ mb: 1 }}>
                 Resource details:
               </Typography>
               <Typography variant="body2" component="div" sx={{ ml: 2 }}>
                 <strong>Type:</strong> {resourceInfo.kind}
               </Typography>
               <Typography variant="body2" component="div" sx={{ ml: 2 }}>
                 <strong>Name:</strong> {resourceInfo.name}
               </Typography>
               {resourceInfo.namespace && (
                 <Typography variant="body2" component="div" sx={{ ml: 2 }}>
                   <strong>Namespace:</strong> {resourceInfo.namespace}
                 </Typography>
               )}
               {(() => {
                 try {
                   const resource = YAML.parse(editedBody);
                   return (
                     <>
                       {resource?.metadata?.labels &&
                         Object.keys(resource.metadata.labels).length > 0 && (
                           <Typography variant="body2" component="div" sx={{ ml: 2 }}>
                             <strong>Labels:</strong>{' '}
                             {Object.entries(resource.metadata.labels)
                               .map(([key, value]) => `${key}=${value}`)
                               .join(', ')}
                           </Typography>
                         )}
                     </>
                   );
                 } catch (e) {
                   return null;
                 }
               })()}
             </Box>
           )}
           <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
             This action cannot be undone.
           </Typography>
         </Box>
       }
       confirmButtonProps={{ color: 'error' }}
       confirmButtonText={`Yes, Delete ${resourceInfo?.kind || 'Resource'}`}
     />
    )
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={!isLoading ? onClose : undefined}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '80vh',
          },
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <Icon
              icon={getMethodIcon()}
              style={{ color: getMethodColor(), marginRight: '8px' }}
              width="24"
              height="24"
            />
            <Typography variant="h6" component="span">
              {getTitle()}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {shouldShowResult && (
            <Box mb={3}>
              <Paper variant="outlined" sx={{ p: 2, maxHeight: '200px', overflow: 'auto' }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                </pre>
              </Paper>
            </Box>
          )}

          {isLoading && (
            <Box display="flex" justifyContent="center" my={3}>
              <CircularProgress size={40} />
            </Box>
          )}

          {!result && !isLoading && (
            <>
              {body && (
                <Box mb={3}>
                  <Editor
                    height="350px"
                    language="yaml" // Always use YAML for better readability
                    value={editedBody}
                    onChange={value => {
                      console.log('Editor value changed:', value);
                      setEditedBody(value || '');
                    }}
                    options={{
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                    }}
                    theme={themeName === 'dark' ? 'vs-dark' : 'light'}
                  />
                </Box>
              )}

              {method.toUpperCase() === 'POST' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Info:</strong> This will create a new resource in the cluster.
                  </Typography>
                  {resourceInfo && (
                    <Box mt={1} ml={2}>
                      <Typography variant="body2">
                        <strong>Type:</strong> {resourceInfo.kind}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Name:</strong> {resourceInfo.name}
                      </Typography>
                      {resourceInfo.namespace && (
                        <Typography variant="body2">
                          <strong>Namespace:</strong> {resourceInfo.namespace}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Alert>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={isLoading}>
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && !isLoading && (
            <Button
              variant="contained"
              onClick={handleSubmit}
              color={'primary'}
              startIcon={<Icon icon={getMethodIcon()} />}
            >
              {getConfirmButtonText()}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}
