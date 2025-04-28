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

    // Check if it has the basic Kubernetes resource structure
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

  // Pattern to detect YAML sections with titles
  const titlePattern = /[─]{3,}[\s\n]*(Sample[\s\w]*YAML:?)[\s\n]*[─]{3,}/gi;
  const titleMatches = [...content.matchAll(titlePattern)];

  if (titleMatches.length > 0) {
    // If we found title patterns, extract YAMLs between them
    for (let i = 0; i < titleMatches.length; i++) {
      const currentMatch = titleMatches[i];
      const title = currentMatch[1]?.trim();
      const startPos = currentMatch.index! + currentMatch[0].length;

      // Find end position (next title or end of content)
      const nextMatch = titleMatches[i + 1];
      const endPos = nextMatch ? nextMatch.index! : content.length;

      // Extract YAML content between titles
      let yamlSection = content.substring(startPos, endPos).trim();

      // Skip explanation sections if present
      const explanationPos = yamlSection.toLowerCase().indexOf('explanation:');
      if (explanationPos !== -1) {
        yamlSection = yamlSection.substring(0, explanationPos).trim();
      }

      // Try to parse as YAML
      try {
        const parsed = YAML.parse(yamlSection);
        if (parsed && typeof parsed === 'object' && parsed.apiVersion && parsed.kind) {
          results.push({
            yaml: yamlSection,
            resourceType: parsed.kind,
            title: title,
          });
        }
      } catch (e) {
        console.log('Error parsing YAML between titles:', e);
      }
    }
  }

  // If we didn't find any YAML with title patterns, try other extraction methods
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

  return results.length > 0 ? results : null;
}

// Helper function to determine if a string contains log data
export function isLogContent(content: string): boolean {
  if (!content || typeof content !== 'string') return false;

  // Check for common log patterns
  const hasTimestampFormat = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(content);
  const hasNewlines = content.includes('\n');
  const hasLogLevels = /\b(INFO|DEBUG|ERROR|WARNING|WARN)\b/i.test(content);

  // Check if it might be a log response object from k8s API
  const isLogResponseObject =
    content.includes('"kind":"Status"') &&
    (content.includes('"status":"Success"') || content.includes('"status":"Failure"'));

  return (
    (hasTimestampFormat && hasNewlines) || (hasLogLevels && hasNewlines) || isLogResponseObject
  );
}
