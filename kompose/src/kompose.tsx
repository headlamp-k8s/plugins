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

  const errorMatch = logs.match(/KOMPOSE_ERROR=(.+)__ENDERROR__/g);
  if (!!errorMatch) {
    output.isError = true;
    output.data = errorMatch[0].slice('KOMPOSE_ERROR='.length, -'__ENDERROR__'.length);
    return output;
  }

  const match = logs.match(/KOMPOSE_OUTPUT=([A-Za-z0-9\s=]+)__ENDOUTPUT__/g);
  if (!!match) {
    const komposeYAML = atob(
      match[0].slice('KOMPOSE_OUTPUT='.length, -'__ENDOUTPUT__'.length).replace(/ /g, '\n')
    );
    output.data = komposeYAML;
  } else {
    output.isError = true;
    output.data = 'Failed to get any output from conversion.';
  }

  return output;
}
