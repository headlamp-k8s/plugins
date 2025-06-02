export const komposeNamespace = 'headlamp-tools';

const generateName = () => {
  return 'kompose-' + Math.random().toString(36).substring(7);
};

/**
 * Create a Kompose pod to convert a Docker Compose file to Kubernetes resources.
 * @param composeBase64 The base64 encoded Docker Compose file.
 * @param komposeImage The image to use for the Kompose container.
 */
export const komposePod = (composeBase64: string, komposeImage: string = '') => {
  return {
    kind: 'Job',
    apiVersion: 'batch/v1',
    metadata: {
      name: generateName(),
      namespace: komposeNamespace,
    },
    spec: {
      activeDeadlineSeconds: 120,
      template: {
        spec: {
          restartPolicy: 'Never',
          terminationGracePeriodSeconds: 30,
          tolerations: [
            {
              operator: 'Exists',
            },
          ],
          containers: [
            {
              name: 'kompose',
              image: komposeImage || 'femtopixel/kompose',
              command: ['sh', '-c'],
              args: [
                `echo "${btoa(
                  composeBase64
                )}" | base64 -d | kompose convert -o /k8s-kompose.yml -f - 2> /k8s-kompose-error.yml && echo KOMPOSE_OUTPUT=$(base64 /k8s-kompose.yml)__ENDOUTPUT__ || echo KOMPOSE_ERROR=$(cat /k8s-kompose-error.yml)__ENDERROR__`,
              ],
            },
          ],
        },
      },
    },
  };
};

/**
 * Get the output from the Kompose conversion.
 * @param logs The logs from the Kompose pod.
 */
export function getKomposeOutput(logs: string) {
  const output = {
    data: '',
    isError: false,
  };

  // Look for the error block
  const errorStart = logs.indexOf('KOMPOSE_ERROR=');
  if (errorStart !== -1) {
    const errorEnd = logs.indexOf('__ENDERROR__', errorStart);
    if (errorEnd !== -1) {
      output.isError = true;
      output.data = logs.slice(errorStart + 'KOMPOSE_ERROR='.length, errorEnd);
      return output;
    }
  }

  // Look for the output block
  const outputStart = logs.indexOf('KOMPOSE_OUTPUT=');
  if (outputStart !== -1) {
    const outputEnd = logs.indexOf('__ENDOUTPUT__', outputStart);
    if (outputEnd !== -1) {
      const encoded = logs.slice(outputStart + 'KOMPOSE_OUTPUT='.length, outputEnd);
      try {
        output.data = atob(encoded.replace(/ /g, '\n'));
      } catch (e) {
        output.isError = true;
        output.data = 'Failed to decode kompose output.';
      }
      return output;
    }
  }

  output.isError = true;
  output.data = 'Failed to get any output from conversion.';
  return output;
}
