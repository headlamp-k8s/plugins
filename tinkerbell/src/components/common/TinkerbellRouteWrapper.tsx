import { Loader, SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { Alert, Box, Typography } from '@mui/material';
import { BmcJob } from '../../resources/bmcJob';
import { BmcMachine } from '../../resources/bmcMachine';
import { BmcTask } from '../../resources/bmcTask';
import { Hardware } from '../../resources/hardware';
import { Template } from '../../resources/template';
import { Workflow } from '../../resources/workflow';
import { WorkflowRuleSet } from '../../resources/workflowRuleSet';

/** Core Tinkerbell CRDs required by the provisioning resource pages. */
export const CORE_TINKERBELL_CRDS = [
  Hardware.crdName,
  Template.crdName,
  Workflow.crdName,
  WorkflowRuleSet.crdName,
];

/** BMC-related Tinkerbell CRDs required by BMC resource pages. */
export const BMC_TINKERBELL_CRDS = [BmcMachine.crdName, BmcJob.crdName, BmcTask.crdName];

/** All Tinkerbell v0.23.0 CRDs surfaced by this plugin. */
export const ALL_TINKERBELL_CRDS = [...CORE_TINKERBELL_CRDS, ...BMC_TINKERBELL_CRDS];

/** Props for routes that should wait for required Tinkerbell CRDs. */
interface TinkerbellRouteWrapperProps {
  /** Route content to render once required CRDs are available. */
  children: React.ReactNode;

  /** CRD names that must exist before rendering the route content. */
  requiredCrds?: string[];
}

/**
 * Renders the missing-CRD state for Tinkerbell routes.
 *
 * @param props - Missing CRD names to show to the user.
 */
function MissingTinkerbellState({ missingCrds }: { missingCrds: string[] }) {
  return (
    <SectionBox title="Tinkerbell CRDs Not Found">
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Alert severity="info">
          This cluster does not expose all required Tinkerbell CRDs for this page yet.
        </Alert>
        <Typography>
          Install Tinkerbell on the connected Kubernetes management cluster to view bare metal
          provisioning resources in Headlamp.
        </Typography>
        <Box component="ul" sx={{ margin: 0, paddingLeft: 3 }}>
          {missingCrds.map(crdName => (
            <Typography component="li" key={crdName}>
              {crdName}
            </Typography>
          ))}
        </Box>
      </Box>
    </SectionBox>
  );
}

/**
 * Waits for required Tinkerbell CRDs before rendering a plugin route.
 *
 * @param props - Route children and the CRDs required by that route.
 */
export function TinkerbellRouteWrapper({
  children,
  requiredCrds = CORE_TINKERBELL_CRDS,
}: TinkerbellRouteWrapperProps) {
  const [hardwareCrd, hardwareError] = CustomResourceDefinition.useGet(Hardware.crdName);
  const [templateCrd, templateError] = CustomResourceDefinition.useGet(Template.crdName);
  const [workflowCrd, workflowError] = CustomResourceDefinition.useGet(Workflow.crdName);
  const [workflowRuleSetCrd, workflowRuleSetError] = CustomResourceDefinition.useGet(
    WorkflowRuleSet.crdName
  );
  const [bmcMachineCrd, bmcMachineError] = CustomResourceDefinition.useGet(BmcMachine.crdName);
  const [bmcJobCrd, bmcJobError] = CustomResourceDefinition.useGet(BmcJob.crdName);
  const [bmcTaskCrd, bmcTaskError] = CustomResourceDefinition.useGet(BmcTask.crdName);

  const crdResults: Record<string, { crd: unknown; error: unknown }> = {
    [Hardware.crdName]: { crd: hardwareCrd, error: hardwareError },
    [Template.crdName]: { crd: templateCrd, error: templateError },
    [Workflow.crdName]: { crd: workflowCrd, error: workflowError },
    [WorkflowRuleSet.crdName]: { crd: workflowRuleSetCrd, error: workflowRuleSetError },
    [BmcMachine.crdName]: { crd: bmcMachineCrd, error: bmcMachineError },
    [BmcJob.crdName]: { crd: bmcJobCrd, error: bmcJobError },
    [BmcTask.crdName]: { crd: bmcTaskCrd, error: bmcTaskError },
  };

  const requiredResults = requiredCrds.map(crdName => crdResults[crdName]);
  const missingCrds = requiredCrds.filter((crdName, index) => requiredResults[index]?.error);

  if (missingCrds.length > 0) {
    return <MissingTinkerbellState missingCrds={missingCrds} />;
  }

  if (requiredResults.some(result => !result?.crd)) {
    return <Loader title="Detecting Tinkerbell CRDs..." />;
  }

  return <>{children}</>;
}
