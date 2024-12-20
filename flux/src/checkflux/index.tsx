import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Box, Link } from '@mui/material';
import { useTheme } from '@mui/material';

export default function Flux404() {
  const theme = useTheme();

    // return a box with a message that flux is not installed and a link to the flux installation guide
    return (
      <Box
        // center this box and also wrap it in a white background with some box shadow
        sx={{
          padding: '1rem',
          alignItems: 'center',
          margin: '2rem auto',
          maxWidth: '600px',
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

export function useFluxInstallCheck() {
  const [deployments] = K8s.ResourceClasses.Deployment.useList({
    labelSelector: 'app.kubernetes.io/part-of=flux,app.kubernetes.io/component=source-controller',
  });

  return deployments;
}

export function useFluxControllerAvailableCheck(props: { name: string }) {
  const { name } = props;
  const [deployments] = K8s.ResourceClasses.Deployment.useList({
    labelSelector: 'app.kubernetes.io/part-of=flux',
  });

  if (deployments === null) {
    return null;
  }

  return deployments?.find(
    deployment => deployment.jsonData.metadata?.labels['app.kubernetes.io/component'] === name
  );
}
