import { Box } from '@mui/material';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';

export default function CheckIfFluxInstalled() {
  const [pods, error] = K8s.ResourceClasses.Pod.useList();
  console.log(pods);
  const helmController =
    pods?.filter(pod => pod.metadata.labels['app'] === 'helm-controller') || [];
  const kustomizeController = pods?.filter(
    pod => pod.metadata.labels['app'] === 'kustomize-controller'
  );
  const notificationController =
    pods?.filter(pod => pod.metadata.labels['app'] === 'notification-controller') || [];
  const sourceController = pods?.filter(pod => pod.metadata.labels['app'] === 'source-controller');
  const imageReflectorController =
    pods?.filter(pod => pod.metadata.labels['app'] === 'image-reflector-controller') || [];
  const imageAutomationController =
    pods?.filter(pod => pod.metadata.labels['app'] === 'image-automation-controller') || [];

  const controllers = helmController?.concat(
    kustomizeController,
    notificationController,
    sourceController,
    imageReflectorController,
    imageAutomationController
  );

  if (controllers.length > 0) {
    return null;
  } else {
    // return a box with a message that flux is not installed and a link to the flux installation guide
    return (
      <Box
        // center this box and also wrap it in a white background with some box shadow
        style={{
          padding: '1rem',
          alignItems: 'center',
          margin: '2rem auto',
          height: '20vh',
          width: '40%',
          backgroundColor: 'white',
          boxShadow: '0 0 10px 0 rgba(0, 0, 0, 0.1)',
        }}
      >
        <h1>Flux is not installed</h1>
        <p>
          Follow the{' '}
          <a target="_blank" href="https://fluxcd.io/docs/installation/">
            installation guide
          </a>{' '}
          to install flux
        </p>
      </Box>
    );
  }
}
