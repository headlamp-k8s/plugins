import { useState, useEffect } from 'react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import { Loader } from '@kinvolk/headlamp-plugin/lib/components/common';
import {Link, Box} from '@mui/material';
export default function FlaggerAvailabilityCheck({ children }) {
  const [isFlaggerInstalled, setIsFlaggerInstalled] = useState(null);
  const [canary, error] = K8s.ResourceClasses.CustomResourceDefinition.useGet('canaries.flagger.app');
  console.log("canary is ", canary);
  console.log("error is ", error);
  useEffect(() => {
    checkFlaggerInstallation();
  }, [canary]);

  async function checkFlaggerInstallation() {
    if(canary === null) return;
    if (canary) {
      setIsFlaggerInstalled(true);
    } else {
      setIsFlaggerInstalled(false);
    }
  }
  console.log("isFlaggerInstalled is ", isFlaggerInstalled);
  
  if (isFlaggerInstalled === null && !error) {
    return <Loader title=""/> // Loading state
  }
  
  if (!isFlaggerInstalled || error) {
    return (
      <Box title="Flagger Not Installed" sx={{
        padding: '1rem',
        alignItems: 'center',
        margin: '2rem auto',
        maxWidth: '600px',
      }}>
        <h1>Flagger is not installed</h1>
        <p>
          Follow the{' '}
          <Link target="_blank" href="https://docs.flagger.app/install/flagger-install-on-kubernetes">
            installation guide
          </Link>{' '}
          to install flagger on your cluster
        </p>
      </Box>
    );
  }

  return children;
}
