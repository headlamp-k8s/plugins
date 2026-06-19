import { SectionBox } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Typography } from '@mui/material';

/** Props used to render a temporary page while a full view is being built. */
interface PlaceholderPageProps {
  /** Page title shown in the Headlamp section header. */
  title: string;

  /** Short explanation of what the future page will show. */
  description: string;

  /** Planned capabilities listed on the placeholder page. */
  plannedItems: string[];
}

/**
 * Renders a simple Headlamp placeholder page for routes that are scaffolded
 * before their full list or detail implementation exists.
 *
 * @param props - Placeholder text and planned page capabilities.
 */
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
