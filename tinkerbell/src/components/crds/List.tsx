import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import CustomResourceDefinition from '@kinvolk/headlamp-plugin/lib/k8s/crd';
import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { BmcJob } from '../../resources/bmcJob';
import { BmcMachine } from '../../resources/bmcMachine';
import { BmcTask } from '../../resources/bmcTask';
import { Hardware } from '../../resources/hardware';
import { Template } from '../../resources/template';
import { Workflow } from '../../resources/workflow';
import { WorkflowRuleSet } from '../../resources/workflowRuleSet';
import { renderStatus } from '../common/listHelpers';

/** Tinkerbell v0.23.0 CRDs checked by the CRD status page. */
const TINKERBELL_CRDS = [
  { name: Hardware.crdName, kind: Hardware.kind, group: 'tinkerbell.org' },
  { name: Template.crdName, kind: Template.kind, group: 'tinkerbell.org' },
  { name: Workflow.crdName, kind: Workflow.kind, group: 'tinkerbell.org' },
  { name: WorkflowRuleSet.crdName, kind: WorkflowRuleSet.kind, group: 'tinkerbell.org' },
  { name: BmcMachine.crdName, kind: BmcMachine.kind, group: 'bmc.tinkerbell.org' },
  { name: BmcJob.crdName, kind: BmcJob.kind, group: 'bmc.tinkerbell.org' },
  { name: BmcTask.crdName, kind: BmcTask.kind, group: 'bmc.tinkerbell.org' },
];

/**
 * Renders a read-only status table for Tinkerbell CRD availability.
 */
export function CrdList() {
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

  return (
    <SectionBox title="Tinkerbell CRDs">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>CRD</TableCell>
            <TableCell>Kind</TableCell>
            <TableCell>API Group</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {TINKERBELL_CRDS.map(crd => {
            const result = crdResults[crd.name];
            const status = result.error ? 'Missing' : result.crd ? 'Installed' : 'Detecting';

            return (
              <TableRow key={crd.name}>
                <TableCell>
                  <Typography variant="body2">{crd.name}</Typography>
                </TableCell>
                <TableCell>{crd.kind}</TableCell>
                <TableCell>{crd.group}</TableCell>
                <TableCell>{renderStatus(status)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </SectionBox>
  );
}
