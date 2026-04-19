import { ActionButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useSnackbar } from 'notistack';
import { useState } from 'react';
import { createJobCommand, VolcanoJobCommandAction } from '../../resources/command';
import { VolcanoJob } from '../../resources/job';

/**
 * Props for the Job lifecycle action button component.
 */
interface JobCommandActionButtonProps {
  /** Job targeted by the lifecycle action. */
  job: VolcanoJob;
  /** Short button label shown in the details header. */
  label: string;
  /** Icon name shown in the action button. */
  icon: string;
  /** Volcano command action issued for the Job. */
  action: VolcanoJobCommandAction;
  /** Success notification shown after command creation. */
  successMessage: string;
  /** Optional longer description for the action. */
  longDescription?: string;
}

/**
 * Renders a lifecycle action button and sends the corresponding Volcano bus command.
 * @see https://github.com/volcano-sh/volcano/blob/master/pkg/cli/vsuspend/suspend.go
 * @see https://github.com/volcano-sh/volcano/blob/master/pkg/cli/vresume/resume.go
 */
export default function JobCommandActionButton({
  job,
  label,
  icon,
  action,
  successMessage,
  longDescription,
}: JobCommandActionButtonProps) {
  const { enqueueSnackbar } = useSnackbar();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onClick = async () => {
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createJobCommand(job, action);
      enqueueSnackbar(successMessage, { variant: 'success' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      enqueueSnackbar(`Failed to ${label.toLowerCase()} job ${job.metadata.name}: ${message}`, {
        variant: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ActionButton
      description={label}
      longDescription={longDescription}
      icon={icon}
      onClick={onClick}
      iconButtonProps={{ disabled: isSubmitting }}
    />
  );
}
