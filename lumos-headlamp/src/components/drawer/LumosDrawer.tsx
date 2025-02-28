import Typography from '@mui/material/Typography';
import { Box } from '@mui/system';


export function LumosDrawer() {

    return (
        <Box sx={{ overflow: 'hidden', border: '5px solid gold', borderRadius: '5px', width: '100%', height: '100%', backgroundColor: 'white', padding: '20px' }}>
            <Box sx={{ marginTop: '-70px' }}>
                <Box sx={{ width: '100%', height: '100%', backgroundColor: 'white', padding: '20px' }}></Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                        <Typography variant="h5">Lumos</Typography>
                    </Box>
                    <Box>
                        <button onClick={() => console.log("click")}>Close</button>
                    </Box>
                </Box>
            </Box>
        </Box>
    );

}
