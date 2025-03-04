import { ActionButton } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useEffect, useState } from 'react';
import { LumosDrawer } from './drawer/LumosDrawer';

export function LumosButton() {

    const [displayDrawer, setDisplayDrawer] = useState<boolean>(false);

    useEffect(() => {
        const currentLocalDisplay = localStorage.getItem('displayLumosDrawer');
        console.log(`currentLocalDisplay: ${currentLocalDisplay}`);

        if (currentLocalDisplay === null) {
            localStorage.setItem('displayLumosDrawer', 'false');
        }

        const displayLumosDrawer = Boolean(localStorage.getItem('displayLumosDrawer'));
        setDisplayDrawer(displayLumosDrawer);

    }, []);



    function toggleLumosDrawer(currentDisplay: Boolean) {

        console.log(`switching from ${currentDisplay} to ${!currentDisplay}`);
        setDisplayDrawer(!currentDisplay);
        localStorage.setItem('displayLumosDrawer', String(!currentDisplay));
    }


    return (
        <>
            <ActionButton
                description="Learn more"
                icon="mdi:lightbulb-outline"
                onClick={() => toggleLumosDrawer(displayDrawer)}
            />
        </>
    )
}


