import { Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { Alert, Box, Typography } from '@mui/material';
import { Hardware } from '../../resources/hardware';
import { Template } from '../../resources/template';
import { Workflow } from '../../resources/workflow';

function MissingTinkerbellState() {
  return (
    <SectionBox title="Tinkerbell CRDs Not Found">
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Alert severity="info">
          This cluster does not expose the Tinkerbell Hardware, Workflow, and Template CRDs yet.
        </Alert>
        <Typography>
          Install Tinkerbell on the connected Kubernetes management cluster to view bare metal
          provisioning resources in Headlamp.
        </Typography>
      </Box>
    </SectionBox>
  );
}

export function TinkerbellRouteWrapper({ children }: { children: React.ReactNode }) {
  const [hardwareCrd, hardwareError] = CustomResourceDefinition.useGet(Hardware.crdName);
  const [workflowCrd, workflowError] = CustomResourceDefinition.useGet(Workflow.crdName);
  const [templateCrd, templateError] = CustomResourceDefinition.useGet(Template.crdName);

  if (hardwareError || workflowError || templateError) {
    return <MissingTinkerbellState />;
  }

  if (!hardwareCrd || !workflowCrd || !templateCrd) {
    return <Loader title="Detecting Tinkerbell CRDs..." />;
  }

  return <>{children}</>;
}
