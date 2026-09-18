import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';

function HelloPlugin() {
    return <h1>Node Readiness Controller Plugin</h1>;
}

registerRoute({
    path: '/nrc-rules',
    component: () => <HelloPlugin />,
    exact: true,
    name: 'Readiness Rules',
    sidebar: 'nrc-rules-list',
});

registerSidebarEntry({
    name: 'nrc-plugin',
    label: 'Node Readiness',
    icon: 'mdi:shield-check',
    url: '/nrc-rules',
});

registerSidebarEntry({
    parent: 'nrc-plugin',
    name: 'nrc-rules-list',
    label: 'Readiness Rules',
    url: '/nrc-rules',
});
