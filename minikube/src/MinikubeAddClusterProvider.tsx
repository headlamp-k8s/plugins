import { Button, Card, CardContent, CardHeader, Typography } from '@mui/material';
import React from 'react';
import { useHistory } from 'react-router-dom';
import MinikubeIcon from './minikube.svg';

export default function MinikubeAddClusterProvider() {
  const history = useHistory();
  return (
    <Card variant="outlined">
      <CardHeader title="Minikube" avatar={<MinikubeIcon width={24} height={24} />} />
      <CardContent>
        <Typography>
          {
            'Minikube is a lightweight tool that simplifies the process of setting up a Kubernetes environment on your local PC. It provides a localStorage, single-node Kubernetes cluster that you can use for learning, development, and testing purposes.'
          }
        </Typography>
        <Button
          variant="contained"
          onClick={() => history.push('/create-cluster-minikube')}
          sx={{ mt: 2 }}
        >
          {'Add'}
        </Button>
      </CardContent>
    </Card>
  );
}
