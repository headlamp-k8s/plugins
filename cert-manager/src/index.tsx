import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { CertificatesList } from './components/certificates/List';
// Main Cert-manager sidebar entry
registerSidebarEntry({
  name: 'Cert-manager',
  url: '/cert-manager/certificates',
  icon: 'mdi:certificate',
  parent: '',
  label: 'Cert-manager',
});

// 1. certificates.cert-manager.io
registerSidebarEntry({
  name: 'Certificates',
  url: '/cert-manager/certificates',
  parent: 'Cert-manager',
  label: 'Certificates',
});

registerRoute({
  path: '/cert-manager/certificates',
  sidebar: 'Certificates',
  component: CertificatesList,
});

registerRoute({
  path: '/cert-manager/certificates/:namespace/:name',
  sidebar: 'Certificates',
  component: () => <div>Certificates Details</div>,
});

// 2. certificaterequests.cert-manager.io
registerSidebarEntry({
  name: 'Certificate Requests',
  url: '/cert-manager/certificaterequests',
  parent: 'Cert-manager',
  label: 'Certificate Requests',
});

registerRoute({
  path: '/cert-manager/certificaterequests',
  sidebar: 'Certificate Requests',
  component: () => <div>Certificate Requests</div>,
});

registerRoute({
  path: '/cert-manager/certificaterequests/:namespace/:name',
  sidebar: 'Certificate Requests',
  component: () => <div>Certificate Requests Details</div>,
});

// 3. challenges.acme.cert-manager.io
registerSidebarEntry({
  name: 'Challenges',
  url: '/cert-manager/challenges',
  parent: 'Cert-manager',
  label: 'Challenges',
});

registerRoute({
  path: '/cert-manager/challenges',
  sidebar: 'Challenges',
  component: () => <div>Challenges</div>,
});

registerRoute({
  path: '/cert-manager/challenges/:namespace/:name',
  sidebar: 'Challenges',
  component: () => <div>Challenges Details</div>,
});

// 4. clusterissuers.cert-manager.io
registerSidebarEntry({
  name: 'Cluster Issuers',
  url: '/cert-manager/clusterissuers',
  parent: 'Cert-manager',
  label: 'Cluster Issuers',
});

registerRoute({
  path: '/cert-manager/clusterissuers',
  sidebar: 'Cluster Issuers',
  component: () => <div>Cluster Issuers</div>,
});

registerRoute({
  path: '/cert-manager/clusterissuers/:name',
  sidebar: 'Cluster Issuers',
  component: () => <div>Cluster Issuers Details</div>,
});

// 5. issuers.cert-manager.io
registerSidebarEntry({
  name: 'Issuers',
  url: '/cert-manager/issuers',
  parent: 'Cert-manager',
  label: 'Issuers',
});

registerRoute({
  path: '/cert-manager/issuers',
  sidebar: 'Issuers',
  component: () => <div>Issuers</div>,
});

registerRoute({
  path: '/cert-manager/issuers/:name',
  sidebar: 'Issuers',
  component: () => <div>Issuers Details</div>,
});

// 6. orders.acme.cert-manager.io
registerSidebarEntry({
  name: 'Orders',
  url: '/cert-manager/orders',
  parent: 'Cert-manager',
  label: 'Orders',
});

registerRoute({
  path: '/cert-manager/orders',
  sidebar: 'Orders',
  component: () => <div>Orders</div>,
});

registerRoute({
  path: '/cert-manager/orders/:namespace/:name',
  sidebar: 'Orders',
  component: () => <div>Orders Details</div>,
});
