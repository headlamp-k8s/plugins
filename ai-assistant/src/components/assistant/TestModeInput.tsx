import { Icon } from '@iconify/react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import React, { useState } from 'react';

interface TestModeInputProps {
  onAddTestResponse: (content: string | object, type: 'assistant' | 'user', hasError?: boolean) => void;
  isTestMode: boolean;
}

const TestModeInput: React.FC<TestModeInputProps> = ({ onAddTestResponse, isTestMode }) => {
  const [open, setOpen] = useState(false);
  const [testContent, setTestContent] = useState('');
  const [responseType, setResponseType] = useState<'assistant' | 'user'>('assistant');
  const [hasError, setHasError] = useState(false);

  // Sample test responses for quick testing
  const sampleResponses: Array<{
    label: string;
    content: string | object;
    type: 'assistant' | 'user';
    hasError?: boolean;
  }> = [
    {
      label: 'Simple Markdown Text',
      content: `Here's how you can create a simple deployment:

## Creating a Deployment

You can create a deployment using the following approaches:

1. **Using kubectl command**
2. **Using YAML manifests**
3. **Using Helm charts**

Let me know which approach you'd prefer!`,
      type: 'assistant' as const,
    },
    {
      label: 'YAML Response with Code Block',
      content: `Here's a sample deployment YAML:

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
      - name: nginx
        image: nginx:1.14.2
        ports:
        - containerPort: 80
\`\`\`

This creates a simple nginx deployment with 3 replicas.`,
      type: 'assistant' as const,
    },
    {
      label: 'Multiple YAML Resources',
      content: `I'll create both a deployment and service for you:

## 1. Deployment

\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webapp
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: webapp
  template:
    metadata:
      labels:
        app: webapp
    spec:
      containers:
      - name: webapp
        image: nginx:latest
        ports:
        - containerPort: 80
\`\`\`

## 2. Service

\`\`\`yaml
apiVersion: v1
kind: Service
metadata:
  name: webapp-service
  namespace: default
spec:
  selector:
    app: webapp
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
\`\`\`

Both resources are now ready to be applied to your cluster.`,
      type: 'assistant' as const,
    },
    {
      label: 'Cluster Issue Summary',
      content: `The \`test-trivy-trivy-operator-6f995dffb8-knb9h\` pod in the \`default\` namespace is in an unusual state in your \`ig-hl-cluster\` cluster. It may require your attention.

Additionally, there are warnings related to this cluster:

- There are 9 IRQs with affinity to 1 CPU.
- Out of 4 nodes, none are available due to the following issues:
  - The \`persistentvolumeclaim "test-trivy-trivy-operator-trivy-cache"\` is not found.
  - Preemption is not helping with scheduling, as 0 out of 4 nodes are available.
- A \`SealedSecret\` resource named \`flux-system/slack-url\` in the \`flux-system\` namespace has failed its dry-run with the error \`no matches for kind "SealedSecret" in version "bitnami.com/v1alpha1"\`.

- Check the IRQ and CPU affinity: [9 IRQs with affinity to 1 CPUs](/c/ig-hl-cluster/irqs/default)
- Examine the node issues: [nodes unavailability](/c/ig-hl-cluster/nodes/default)
- Investigate the sealed secret issue: [SealedSecret/flux-system/slack-url](/c/ig-hl-cluster/sealedsecrets/flux-system/slack-url)`,
      type: 'assistant' as const,
    },
    {
      label: 'Headlamp Link',
      content: `You can view the resource details in Headlamp by clicking the link below:

- [deployment-link](https://headlamp/resource-details?cluster=ig-hl-cluster&kind=Deployment&resource=nginx-deployment&ns=default)
- [cluster-link](https://headlamp/cluster?cluster=ig-hl-cluster)
- [missing-details-link](https://headlamp/resource-details?cluster=ig-hl-cluster&kind=Deployment)
- [unsupported-resource](https://headlamp/resource-details?cluster=ig-hl-cluster&kind=UnsupportedKind&resource=unsupported-resource)
- \`[some-backquoted-link](https://headlamp/resource-details?cluster=ig-hl-cluster&kind=Deployment&resource=nginx-deployment&ns=default)\`
- [https://headlamp/cluster?cluster=ig-hl-cluster]
- [https://headlamp/unsupported-link?cluster=ig-hl-cluster&kind=Deployment]
- [external-link](https://headlamp.dev/docs)`,
      type: 'assistant' as const,
    },
    {
      label: 'Resource Table Result',
      content: `Found 3 items across 2 namespaces:

| NAME | NAMESPACE | STATUS | AGE |
|------|-----------|--------|-----|
| nginx-deployment | default | Running | 5d |
| webapp | kube-system | Running | 2d |
| api-server | production | Pending | 1h |

All deployments are currently active in your cluster.`,
      type: 'assistant' as const,
    },
    {
      label: 'Error Response',
      content: `I'm sorry, but I cannot help with that request as it violates content policies.`,
      type: 'assistant' as const,
      hasError: true,
    },
    {
      label: 'User Question',
      content: `How can I create a deployment with 3 replicas of nginx?`,
      type: 'user' as const,
    },
    {
      label: 'Tool Confirmation - Kubernetes API',
      content: {
        role: "assistant",
        content: "",
        toolConfirmation: {
          tools: [
            {
              id: "call_O7EYtgCzt5RmchxdZDJihMEF",
              name: "kubernetes_api_request",
              description: "Executes Kubernetes API operations",
              arguments: {
                url: "/api/v1/namespaces/default/pods",
                method: "GET"
              },
              type: "regular"
            }
          ],
          loading: false,
          requestId: "tool-approval-1759265356521-0.1868110264399998",
          userContext: {
            timeContext: "2025-09-30T20:49:16.521Z",
            userMessage: "List me the pods here.",
            conversationHistory: [
              {
                role: "user",
                content: "List me the pods here."
              },
              {
                role: "assistant",
                content: ""
              }
            ]
          }
        },
        isDisplayOnly: true,
        requestId: "tool-approval-1759265356521-0.1868110264399998"
      },
      type: 'assistant' as const,
    },
    {
      label: 'Tool Confirmation - MCP Tool',
      content: {
        role: "assistant",
        content: "",
        toolConfirmation: {
          tools: [
            {
              id: "call_MCP_example",
              name: "flux_get_resources",
              description: "Get Flux resources from the cluster",
              arguments: {
                namespace: "flux-system",
                resourceType: "helmreleases",
                name: ""
              },
              type: "mcp"
            }
          ],
          loading: false,
          requestId: "tool-approval-mcp-test",
          userContext: {
            timeContext: "2025-09-30T20:49:16.521Z",
            userMessage: "Show me the Flux Helm releases.",
            conversationHistory: [
              {
                role: "user",
                content: "Show me the Flux Helm releases."
              },
              {
                role: "assistant",
                content: ""
              }
            ]
          }
        },
        isDisplayOnly: true,
        requestId: "tool-approval-mcp-test"
      },
      type: 'assistant' as const,
    },
    {
      label: 'Tool Confirmation - Multiple Tools',
      content: {
        role: "assistant",
        content: "",
        toolConfirmation: {
          tools: [
            {
              id: "call_k8s_get_pods",
              name: "kubernetes_api_request",
              description: "Get pods from Kubernetes API",
              arguments: {
                url: "/api/v1/namespaces/default/pods",
                method: "GET"
              },
              type: "regular"
            },
            {
              id: "call_flux_check",
              name: "flux_get_helmreleases",
              description: "Check Flux Helm releases",
              arguments: {
                namespace: "flux-system",
                name: "",
                output: "json"
              },
              type: "mcp"
            }
          ],
          loading: false,
          requestId: "tool-approval-multi-test",
          userContext: {
            timeContext: "2025-09-30T20:49:16.521Z",
            userMessage: "Show me pods and Flux releases.",
            conversationHistory: [
              {
                role: "user",
                content: "Show me pods and Flux releases."
              },
              {
                role: "assistant",
                content: ""
              }
            ]
          }
        },
        isDisplayOnly: true,
        requestId: "tool-approval-multi-test"
      },
      type: 'assistant' as const,
    }
  ];

  const handleSubmit = () => {
    if (testContent.trim()) {
      let content: string | object = testContent;

      // Try to parse as JSON if it looks like a tool confirmation object
      if (testContent.trim().startsWith('{') && testContent.includes('toolConfirmation')) {
        try {
          content = JSON.parse(testContent);
        } catch (error) {
          console.warn('Failed to parse JSON content, using as string:', error);
        }
      }

      onAddTestResponse(content, responseType, hasError);
      setTestContent('');
      setOpen(false);
    }
  };

  const handleSampleResponse = (sample: (typeof sampleResponses)[0]) => {
    onAddTestResponse(sample.content, sample.type, sample.hasError || false);
  };

  if (!isTestMode) {
    return null;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Tooltip title="Add Test Response">
          <IconButton
            onClick={() => setOpen(true)}
            color="primary"
            size="small"
            sx={{ border: '1px dashed', borderColor: 'primary.main' }}
          >
            <Icon icon="mdi:test-tube" width="16px" />
          </IconButton>
        </Tooltip>
        <Typography variant="caption" color="text.secondary">
          Test Mode Active - Add custom responses
        </Typography>
      </Box>

      {/* Quick sample buttons */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
        {sampleResponses.map((sample, index) => (
          <Button
            key={index}
            variant="outlined"
            size="small"
            onClick={() => handleSampleResponse(sample)}
            sx={{ fontSize: '0.75rem', textTransform: 'none' }}
          >
            {sample.label}
          </Button>
        ))}
      </Box>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Test Response</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Response Type</InputLabel>
              <Select
                value={responseType}
                label="Response Type"
                onChange={e => setResponseType(e.target.value as 'assistant' | 'user')}
              >
                <MenuItem value="assistant">AI Assistant Response</MenuItem>
                <MenuItem value="user">User Message</MenuItem>
              </Select>
            </FormControl>

            {responseType === 'assistant' && (
              <FormControlLabel
                control={
                  <Switch checked={hasError} onChange={e => setHasError(e.target.checked)} />
                }
                label="Simulate Error Response"
              />
            )}

            <TextField
              label="Response Content"
              multiline
              rows={12}
              fullWidth
              value={testContent}
              onChange={e => setTestContent(e.target.value)}
              placeholder="Enter your test response here. You can use markdown, YAML code blocks, or JSON objects for tool confirmations."
              variant="outlined"
            />

            <Typography variant="caption" color="text.secondary">
              Tip: Use ```yaml code blocks to test YAML rendering, markdown for formatting tests, or JSON objects starting with {'{toolConfirmation: ...}'} to test tool confirmation dialogs.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!testContent.trim()}>
            Add Response
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TestModeInput;
