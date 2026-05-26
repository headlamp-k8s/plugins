import { TrainJobClass } from '../../resources/trainJob';
import { KubeflowStatusBadge } from '../common/KubeflowStatusBadge';
import { getTrainJobStatusInfo } from './trainerUtils';

/**
 * Renders the shared Trainer status badge for a TrainJob.
 */
export function TrainJobStatusBadge({ job }: { job: TrainJobClass }) {
  return <KubeflowStatusBadge statusInfo={getTrainJobStatusInfo(job)} />;
}
