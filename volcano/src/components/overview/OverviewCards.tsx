import { Icon } from '@iconify/react';
import { Box, Card, CardContent, Typography } from '@mui/material';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: string;
  subtitle: string;
}

export function SummaryCard({ title, value, icon, subtitle }: SummaryCardProps) {
  return (
    <Card variant="outlined" sx={{ borderRadius: '4px', height: '100%' }}>
      <CardContent sx={{ py: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, color: 'text.primary' }}>
          <Icon icon={icon} width="28" height="28" style={{ marginRight: '8px' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" sx={{ fontWeight: 800, fontSize: '2.5rem' }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );
}
