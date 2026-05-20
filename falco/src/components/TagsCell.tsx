import Box from '@mui/material/Box';
import React from 'react';
import { getTagColor } from '../utils/falcoEventUtils';

/**
 * Props for the TagsCell component.
 */
interface TagsCellProps {
  tags: string[];
}

/**
 * A component to display tags with colors in a table cell.
 */
const TagsCell: React.FC<TagsCellProps> = ({ tags }) => {
  if (!Array.isArray(tags) || tags.length === 0) {
    return <>-</>;
  }

  return (
    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
      {tags.map(tag => (
        <Box
          key={tag}
          component="span"
          sx={{
            display: 'inline-block',
            px: 1,
            py: 0.25,
            borderRadius: 2,
            fontWeight: 500,
            fontSize: '0.80em',
            color: '#fff',
            backgroundColor: getTagColor(tag),
            textTransform: 'lowercase',
            letterSpacing: 0.5,
          }}
        >
          {tag}
        </Box>
      ))}
    </Box>
  );
};

export default TagsCell;
