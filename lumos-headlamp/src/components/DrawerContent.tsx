import { Box } from '@mui/material';
import React from 'react';
import { DocsContent } from './content/docs/DocsContent';


// The goal of this component is to display the drawer content within the top section of the details view
// - We must have different content mediums to place into the DrawerContent section
// - This is meant to be a container for the drawer content, starting with docs content first

export function DrawerContent() {

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'start',
            overflow: 'hidden',
            // border: '3px solid gold',
            width: '100%',
            height: '100%',
        }}>

            <DocsContent />
        </Box >
    );

}


