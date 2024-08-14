import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Loader } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Link } from '@mui/material';
import { useTheme } from '@mui/material';

export default function CheckIfFluxInstalled() {
  const theme = useTheme();
  const [deployments] = K8s.ResourceClasses.Deployment.useList({
    labelSelector: 'app.kubernetes.io/part-of=flux',
  });

  if (deployments === null) {
    return <Loader />;
  }
  if (
    deployments?.find(
      deployment =>
        deployment.jsonData.metadata?.labels['app.kubernetes.io/component'] === 'source-controller'
    )
  ) {
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

export function useFluxControllerAvailableCheck(props: { name: string }) {
  const { name } = props;
  const [deployments] = K8s.ResourceClasses.Deployment.useList({
    labelSelector: 'app.kubernetes.io/part-of=flux',
  });

  if (deployments === null) {
    return null;
  }

  const isFluxAvailable = deployments?.find(
    deployment =>
      deployment.jsonData.metadata?.labels['app.kubernetes.io/component'] === 'source-controller'
  );

  if (!isFluxAvailable) {
    return true;
  }

  return deployments?.find(
    deployment => deployment.jsonData.metadata?.labels['app.kubernetes.io/component'] === name
  );
}
