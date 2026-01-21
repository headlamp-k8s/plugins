import { Icon } from '@iconify/react';
import { Box, Button, Typography } from '@mui/material';
import React from 'react';


interface LumosButtonProps {
    displayDrawer: boolean;
    toggleHandle: (currentDisplay: boolean) => void;
}

// function LumosIcon() {
//     return (
//         <IconifyIcon icon="mdi:lightbulb-outline" />
//     )
// }

export function LumosButton({ displayDrawer, toggleHandle }: LumosButtonProps) {

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
            }}
        >
            {/* <ActionButton
                description="Learn more"
                icon="mdi:lightbulb-outline"
                onClick={() => toggleHandle(displayDrawer)}
            /> */}

            <Button
                variant="contained"
                onClick={() => toggleHandle(displayDrawer)}
                size="small"
                startIcon={<Icon icon="mdi:lightbulb-outline" />}
                sx={{
                    backgroundColor: '#000',
                    color: 'white',
                    textTransform: 'none',
                    '&:hover': {
                        background: '#605e5c',
                    },
                }}
            >
                <Typography sx={{ marginTop: '0.2rem' }}>Documentation</Typography>
            </Button>
        </Box>
    )
}


