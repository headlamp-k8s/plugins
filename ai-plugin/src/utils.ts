import { useBetween } from 'use-between';
import React from 'react';

function usePluginSettings() {
    const [event, setEvent] = React.useState(null);

    return {
        event,
        setEvent,
    }
}

export const useGlobalState = () => useBetween(usePluginSettings);