import YAML from 'yaml';

export interface YamlExample {
  title: string;
  filename: string;
  yaml: string;
  resourceType: string;
}

export const yamlExamples: YamlExample[] = [
  {
    title: 'Sample Pod',
    filename: 'sample-pod.yaml',
    resourceType: 'Pod',
    yaml: `apiVersion: v1
kind: Pod
metadata:
  name: sample-pod
  namespace: default
spec:
  containers:
    - name: nginx
      image: nginx:alpine
      ports:
        - containerPort: 80`,
  },
  {
    title: 'Sample Deployment',
    filename: 'sample-deployment.yaml',
    resourceType: 'Deployment',
    yaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: sample-deployment
  namespace: default
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sample-app
  template:
    metadata:
      labels:
        app: sample-app
    spec:
      containers:
        - name: sample-container
          image: nginx:stable
          ports:
            - containerPort: 80`,
  },
  {
    title: 'Sample Service',
    filename: 'sample-service.yaml',
    resourceType: 'Service',
    yaml: `apiVersion: v1
kind: Service
metadata:
  name: sample-service
  namespace: default
spec:
  selector:
    app: sample-app
  ports:
    - protocol: TCP
      port: 80
      targetPort: 80
  type: ClusterIP`,
  },
  {
    title: 'Sample Ingress',
    filename: 'sample-ingress.yaml',
    resourceType: 'Ingress',
    yaml: `apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: sample-ingress
  namespace: default
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /
spec:
  rules:
    - host: example.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: sample-service
                port:
                  number: 80`,
  },
  {
    title: 'Sample ConfigMap',
    filename: 'sample-configmap.yaml',
    resourceType: 'ConfigMap',
    yaml: `apiVersion: v1
kind: ConfigMap
metadata:
  name: sample-config
  namespace: default
data:
  sample.property: "Hello, Kubernetes!"
  another.property: "This is a sample value."`,
  },
  {
    title: 'Sample Secret',
    filename: 'sample-secret.yaml',
    resourceType: 'Secret',
    yaml: `apiVersion: v1
kind: Secret
metadata:
  name: sample-secret
  namespace: default
type: Opaque
data:
  # These values are base64-encoded. For example, "admin" becomes "YWRtaW4="
  username: YWRtaW4=
  password: c2VjcmV0`,
  },
  {
    title: 'Sample Namespace',
    filename: 'sample-namespace.yaml',
    resourceType: 'Namespace',
    yaml: `apiVersion: v1
kind: Namespace
metadata:
  name: sample-namespace`,
  },
  {
    title: 'Sample Job',
    filename: 'sample-job.yaml',
    resourceType: 'Job',
    yaml: `apiVersion: batch/v1
kind: Job
metadata:
  name: sample-job
  namespace: default
spec:
  template:
    metadata:
      name: sample-job
    spec:
      containers:
        - name: job
          image: busybox
          command: ["echo", "Hello from the Job!"]
      restartPolicy: Never
  backoffLimit: 4`,
  },
  {
    title: 'Sample CronJob',
    filename: 'sample-cronjob.yaml',
    resourceType: 'CronJob',
    yaml: `apiVersion: batch/v1
kind: CronJob
metadata:
  name: sample-cronjob
  namespace: default
spec:
  schedule: "*/5 * * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
            - name: cronjob
              image: busybox
              args:
                - /bin/sh
                - -c
                - date; echo "Hello from the CronJob!"
          restartPolicy: OnFailure`,
  },
  {
    title: 'Sample PersistentVolumeClaim',
    filename: 'sample-pvc.yaml',
    resourceType: 'PersistentVolumeClaim',
    yaml: `apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: sample-pvc
  namespace: default
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi`,
  },
];

// Function to validate and parse YAML to extract resource type and metadata
export function parseKubernetesYAML(yamlStr: string): {
  isValid: boolean;
  resourceType?: string;
  name?: string;
  namespace?: string;
} {
  try {
    const parsed = YAML.parse(yamlStr);

    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false };
    }

    // Check if it has the basic Kubernetes resource structure - just need apiVersion and kind
    if (!parsed.apiVersion || !parsed.kind) {
      return { isValid: false };
    }

    // Extract resource name and namespace if available
    const name = parsed.metadata?.name;
    const namespace = parsed.metadata?.namespace || 'default';

    return {
      isValid: true,
      resourceType: parsed.kind,
      name,
      namespace,
    };
  } catch (error) {
    console.warn('Failed to parse YAML:', error);
    return { isValid: false };
  }
}

// Extract YAML content from text that may contain markdown-style code blocks or separator patterns
export function extractYamlContent(
  content: string
): { yaml: string; resourceType: string; title?: string }[] | null {
  if (!content) return null;

  const results: { yaml: string; resourceType: string; title?: string }[] = [];

  // Simple YAML extraction:
  // 1. Split content by triple backticks
  const codeBlockRegex = /```yaml\n([\s\S]*?)```/g;
  const codeBlockRegex2 = /```([\s\S]*?)```/g;
  const codeBlockRegex3 = /~~~yaml\n([\s\S]*?)~~~(?!\n)/g;
  const codeBlockRegex4 = /~~~([\s\S]*?)~~~(?!\n)/g;

  const extractFromCodeBlock = (match: string) => {
    const yamlContent = match.trim();
    try {
      const parsed = YAML.parse(yamlContent);
      if (parsed && typeof parsed === 'object' && parsed.apiVersion && parsed.kind) {
        results.push({
          yaml: yamlContent,
          resourceType: parsed.kind,
        });
      }
    } catch (e) {
      console.log('Error parsing YAML code block:', e);
    }
  };

  let match;
  while ((match = codeBlockRegex.exec(content)) !== null) {
    extractFromCodeBlock(match[1]);
  }
  while ((match = codeBlockRegex2.exec(content)) !== null) {
    extractFromCodeBlock(match[1]);
  }
  while ((match = codeBlockRegex3.exec(content)) !== null) {
    extractFromCodeBlock(match[1]);
  }
  while ((match = codeBlockRegex4.exec(content)) !== null) {
    extractFromCodeBlock(match[1]);
  }

  // If no results found with code blocks, fall back to other patterns
  if (results.length === 0) {
    // Look for YAML surrounded by dashed lines
    const dashedPattern = /[-]{3,}[\r\n]+([\s\S]*?)[-]{3,}/g;
    let dashMatch;

    while ((dashMatch = dashedPattern.exec(content)) !== null) {
      if (dashMatch[1] && dashMatch[1].trim()) {
        const yamlContent = dashMatch[1].trim();

        try {
          const parsed = YAML.parse(yamlContent);
          if (parsed && typeof parsed === 'object' && parsed.apiVersion && parsed.kind) {
            // Try to find a title from the preceding content
            const precedingContent = content.substring(0, dashMatch.index).trim();
            const lastLineBreak = precedingContent.lastIndexOf('\n');
            const possibleTitle = precedingContent.substring(lastLineBreak + 1).trim();

            results.push({
              yaml: yamlContent,
              resourceType: parsed.kind,
              title: possibleTitle.length > 0 ? possibleTitle : `Sample ${parsed.kind}`,
            });
          }
        } catch (e) {
          // Not valid YAML, continue
          console.log('Error parsing dashed YAML section:', e);
        }
      }
    }

    // If still no results, fall back to other extraction methods
    if (results.length === 0) {
      // Check for YAML code blocks using markdown style
      const yamlRegex = /```(?:ya?ml)?\s*([\s\S]*?)```/g;
      let match;

      while ((match = yamlRegex.exec(content)) !== null) {
        if (match[1] && match[1].trim()) {
          const yamlContent = match[1].trim();
          try {
            const parsed = YAML.parse(yamlContent);
            if (parsed && typeof parsed === 'object' && parsed.apiVersion && parsed.kind) {
              results.push({
                yaml: yamlContent,
                resourceType: parsed.kind,
              });
            }
          } catch (e) {
            console.log('Error parsing YAML code block:', e);
          }
        }
      }

      // If still no results, look for sections with clear apiVersion and kind
      if (results.length === 0) {
        const contentByLines = content.split('\n');
        let currentYaml = '';
        let inYamlBlock = false;

        for (let i = 0; i < contentByLines.length; i++) {
          const line = contentByLines[i].trim();

          if (line.startsWith('apiVersion:')) {
            // Start collecting a new YAML block
            inYamlBlock = true;
            currentYaml = line + '\n';
          } else if (inYamlBlock) {
            // If we hit a blank line after collecting some YAML, try to finalize it
            if (line === '' && currentYaml.length > 0) {
              try {
                const parsed = YAML.parse(currentYaml);
                if (parsed && typeof parsed === 'object' && parsed.apiVersion && parsed.kind) {
                  results.push({
                    yaml: currentYaml.trim(),
                    resourceType: parsed.kind,
                  });
                }
              } catch (e) {
                // Not valid YAML yet, continue collecting
              }

              // Reset for next block
              currentYaml = '';
              inYamlBlock = false;
            } else {
              // Keep collecting lines
              currentYaml += line + '\n';
            }
          }
        }

        // Check the last collected block
        if (inYamlBlock && currentYaml.length > 0) {
          try {
            const parsed = YAML.parse(currentYaml);
            if (parsed && typeof parsed === 'object' && parsed.apiVersion && parsed.kind) {
              results.push({
                yaml: currentYaml.trim(),
                resourceType: parsed.kind,
              });
            }
          } catch (e) {
            // Not valid YAML, ignore
          }
        }
      }
    }
  }

  return results.length > 0 ? results : null;
}
