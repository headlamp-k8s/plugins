import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Typography } from '@mui/material';

interface PlaceholderPageProps {
  title: string;
  description: string;
  plannedItems: string[];
}

export function PlaceholderPage({ title, description, plannedItems }: PlaceholderPageProps) {
  return (
    <SectionBox title={title}>
      <Box sx={{ display: 'grid', gap: 2 }}>
        <Typography>{description}</Typography>
        <Box component="ul" sx={{ margin: 0, paddingLeft: 3 }}>
          {plannedItems.map(item => (
            <Typography component="li" key={item}>
              {item}
            </Typography>
          ))}
        </Box>
      </Box>
    </SectionBox>
  );
}
