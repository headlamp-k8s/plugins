import { HoverInfoLabel, NameValueTable } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Typography } from '@mui/material';
import { useState } from 'react';
import { store } from '../charts/List';
import { EnableSwitch } from './EnableSwitch';

export interface AppCatalogSettingsProps {
    initialConfig?: { showOnlyVerified: boolean };
}

export function AppCatalogSettings({ initialConfig }: AppCatalogSettingsProps) {
    const config = initialConfig || store.get();

    const [currentConfig, setCurrentConfig] = useState(config);

    function handleSave(value) {
        const updatedConfig = { showOnlyVerified: value };
        store.set(updatedConfig);
        setCurrentConfig(store.get());
        return;
    }

    function toggleShowOnlyVerified() {
        const newShowOnlyVerified = currentConfig?.showOnlyVerified;
        handleSave(!newShowOnlyVerified);
    }

    return (
        <Box
            style={{
                marginTop: '3rem',
            }}
        >
            <Typography variant="h5">App Catalog Settings</Typography>
            <NameValueTable
                rows={[
                    {
                        name: (
                            <HoverInfoLabel
                                label="Only verified"
                                hoverInfo="Show charts from verified publishers only"
                            />
                        ),
                        value: (
                            <EnableSwitch checked={!!currentConfig?.showOnlyVerified} onChange={toggleShowOnlyVerified} />
                        ),
                    },
                ]}
            />
        </Box>
    );
}