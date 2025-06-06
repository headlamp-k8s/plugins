import { Box, Button, Typography } from '@mui/material';
import { useEffect, useState } from 'react';
import { DrawerContent } from './DrawerContent';
import { LumosButton } from './LumosButton';


export function LumosDrawer() {

    const [displayDrawer, setDisplayDrawer] = useState<boolean>(false);
    const [displayButton, setDisplayButton] = useState<boolean>(true);

    useEffect(() => {
        const currentLocalDisplay = localStorage.getItem('displayLumosDrawer');
        console.log(`currentLocalDisplay: ${currentLocalDisplay}`);

        if (currentLocalDisplay === null) {
            localStorage.setItem('displayLumosDrawer', 'false');
        }

        const displayLumosDrawer = Boolean(localStorage.getItem('displayLumosDrawer'));
        setDisplayDrawer(displayLumosDrawer);

    }, []);

    useEffect(() => {
        if (displayDrawer) {
            setDisplayButton(false);
        } else {
            setDisplayButton(true);
        }
    }, [displayDrawer])


    function toggleLumosDrawer(currentDisplay: Boolean) {

        console.log(`switching from ${currentDisplay} to ${!currentDisplay}`);
        setDisplayDrawer(!currentDisplay);
        localStorage.setItem('displayLumosDrawer', String(!currentDisplay));

        if (currentDisplay) {
            setDisplayButton(false);
        }
    }

    // thinking about maybe removing the close button? or keep it in but to the right so we can close the docs viewer drawer like that
    //      - think of it as a light to open but then the clolse to close it?

    // need to find a way to get the drawer content to hold the docs viewer but needs something extra?
    // need to have the search bar at the top of the drawer then the docs viewer below it
    //      this would mean leaerning the docs viewer find key words and parse from the search?

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', width: '100%', height: '100%' }}>
            {displayButton && <LumosButton displayDrawer={displayDrawer} toggleHandle={toggleLumosDrawer} />}

            {displayDrawer &&
                <Box
                    sx={{
                        display: 'flex', flexDirection: 'row', justifyContent: 'center',
                        overflow: 'hidden',
                        border: '1px solid gray',
                        // backgroundColor: 'gray',
                        borderRadius: '5px',
                        width: '100%',
                        height: '100%',
                        padding: '1rem'
                    }}>



                    <Box sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'start',
                        justifyContent: 'start',
                        width: '100%',
                        // backgroundColor: 'blue',
                        // padding: '1rem',
                    }}>

                        <DrawerContent />

                    </Box>


                    <Box sx={{
                        alignSelf: 'flex-start',
                        marginBottom: '1rem',
                        // backgroundColor: 'gold',
                        // padding: '1rem',
                    }} >
                        <Button
                            sx={{
                                backgroundColor: '#000',
                                color: 'white',
                                textTransform: 'none',
                                '&:hover': {
                                    background: '#605e5c',
                                },
                            }}
                            onClick={toggleLumosDrawer}
                        >
                            <Typography sx={{ marginTop: '0.2rem' }}>Close</Typography>
                        </Button>
                    </Box>
                </Box>
            }
        </Box>
    );

}
