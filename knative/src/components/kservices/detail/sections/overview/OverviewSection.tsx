import { Stack } from '@mui/material';
import { KService } from '../../../../../resources/knative';
import ConditionsSection from './ConditionsSection';

type KServiceSectionProps = {
  kservice: KService;
};

export function OverviewSection({ kservice }: KServiceSectionProps) {
  return (
    <Stack spacing={2}>
      {kservice.status?.conditions && <ConditionsSection conditions={kservice.status.conditions} />}
    </Stack>
  );
}
