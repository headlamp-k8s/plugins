import { Icon } from '@iconify/react';
// import { DocsViewer } from '@kinvolk/headlamp-plugin/lib/components/common/index';
import { Box, Button, InputAdornment, TextField, Typography } from '@mui/material';
import React, { useState } from 'react';


// to do: need to add this in later after search bar is in

export function LumosSearchBar() {
    // If search is not focused, display this placeholder
    const [placeholderValue, setPlaceholderValue] = useState('');

    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'start',
                margin: '1rem',
            }}

        >
            <TextField
                id="outlined-basic"
                label="Search"
                variant="outlined"
                size="small"
                placeholder={'Search keyword'}
                sx={{ width: '25%' }}
                InputProps={{
                    autoFocus: true,
                    value: placeholderValue,
                    onChange: e => {
                        setPlaceholderValue(e.target.value);
                    },
                    startAdornment: (
                        <InputAdornment position="start" sx={{ pointerEvents: 'none' }}>
                            <Icon icon="mdi:search" width={18} height={18} />
                        </InputAdornment>
                    )
                }}
            />
            <Button
                variant="contained"
                color="primary"
                size="small"
                sx={{ marginLeft: '1rem' }}
            > Search
            </Button>
        </Box>
    )
}

export function DocsContent() {

    // to do: need a way to tell what resource we are looking at so that we can parse the docs with that resourceContext


    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'start',
                overflow: 'hidden',
                // border: '3px solid silver',
                width: '100%',
                height: '100%',
            }}
        >
            <Box>
                <Typography variant="h5">Documentation</Typography>
            </Box>
            <LumosSearchBar />
            <Typography variant="h5">Docs</Typography>
            {/* <DocsViewer docSpecs={docSpecs} /> */}
        </Box>
    )
}

