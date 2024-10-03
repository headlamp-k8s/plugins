import { Box, Link } from '@mui/material';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { SectionBox } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useTheme } from '@mui/material';

export default function CheckIfFluxInstalled() {
  const theme = useTheme();
  const [pods, error] = K8s.ResourceClasses.Pod.useList();

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
          width: '50%',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <h1>Flux is not installed</h1>
        <p>
          Follow the{' '}
          <Link target="_blank" href="https://fluxcd.io/docs/installation/">
            installation guide
          </Link>{' '}
          to install flux on your cluster
        </p>
      </Box>
    );
  }
}
