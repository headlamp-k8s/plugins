import { Icon } from '@iconify/react';
import { Box, Card, CardContent, Tooltip, Typography } from '@mui/material';
import React from 'react';

export interface MetricCardProps {
  /** Card heading label (uppercase). */
  title: string;
  /** Numeric value displayed prominently. */
  value: number;
  /** Short descriptive caption below the value. */
  caption: string;
  /** Iconify icon identifier (e.g. 'mdi:shield-check-outline'). */
  icon: string;
  /** Hex color applied to the icon when the value is non-zero. */
  activeColor: string;
  /** MUI palette token for the card border when the value is non-zero. Defaults to 'divider'. */
  activeBorderColor?: string;
  /** Optional custom font size for the icon to balance optical weight (defaults to '2.2rem'). */
  iconSize?: string;
  /** Click handler (typically navigates to the rules list). */
  onClick: () => void;
  /** Optional tooltip text shown on hover. */
  tooltip?: string;
}

/**
 * A reusable metric summary card for the landing page.
 * Renders a title, large numeric value, caption, and an icon with conditional coloring.
 */
export default function MetricCard({
  title,
  value,
  caption,
  icon,
  activeColor,
  activeBorderColor,
  iconSize = '2.2rem',
  onClick,
  tooltip,
}: MetricCardProps) {
  const card = (
    <Card
      elevation={0}
      role="button"
      tabIndex={0}
      sx={{
        height: '100%',
        border: '1px solid',
        borderColor: value > 0 && activeBorderColor ? activeBorderColor : 'divider',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 2 },
        '&:focus-visible': {
          outline: theme => `2px solid ${theme.palette.primary.main}`,
          outlineOffset: '2px',
        },
      }}
      onClick={onClick}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography
              color="text.secondary"
              gutterBottom
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontSize: '0.75rem',
              }}
            >
              {title}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                color: value > 0 && activeBorderColor ? activeBorderColor : 'text.primary',
                fontWeight: 600,
              }}
            >
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {caption}
            </Typography>
          </Box>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            sx={{ width: '2.6rem', height: '2.6rem' }}
          >
            <Icon
              icon={icon}
              style={{
                fontSize: iconSize,
                color: value > 0 ? activeColor : 'var(--mui-palette-text-secondary)',
                opacity: 0.8,
              }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow describeChild>
        {card}
      </Tooltip>
    );
  }

  return card;
}
