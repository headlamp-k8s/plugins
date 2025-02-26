import React from 'react';
import { StatusLabel } from '@kinvolk/headlamp-plugin/lib/components/common';

export default function CanaryStatus({ status }) {
    let type;
    switch (status) {
        case 'Progressing':
            type = 'warning';
            break;
        case 'Succeeded':
            type = 'success';
            break;
        case 'Failed':
            type = 'error';
            break;
        default:
            type = '';


    }
    return <StatusLabel status={type}>{status}</StatusLabel>;
}
