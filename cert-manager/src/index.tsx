import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { CertificateRequestDetail } from './components/certificateRequests/Detail';
import { CertificateRequestsList } from './components/certificateRequests/List';
import { CertificateDetail } from './components/certificates/Detail';
import { CertificatesList } from './components/certificates/List';
import { ChallengeDetail } from './components/challenges/Detail';
import { ChallengesList } from './components/challenges/List';
import { ClusterIssuerDetail } from './components/clusterIssuers/Detail';
import { ClusterIssuersList } from './components/clusterIssuers/List';
import { IssuersList } from './components/issuers/List';
import { OrderDetail } from './components/orders/Detail';
import { OrdersList } from './components/orders/List';
import { IssuerDetail } from './components/issuers/Detail';

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
  path: '/cert-manager/certificates/:namespace/:name',
  sidebar: 'Certificates',
  name: 'Certificate',
  component: CertificateDetail,
});

registerRoute({
  path: '/cert-manager/certificates',
  sidebar: 'Certificates',
  name: 'Certificates',
  component: CertificatesList,
});

// 2. certificaterequests.cert-manager.io
registerSidebarEntry({
  name: 'Certificate Requests',
  url: '/cert-manager/certificaterequests',
  parent: 'Cert-manager',
  label: 'Certificate Requests',
});

registerRoute({
  path: '/cert-manager/certificaterequests/:namespace/:name',
  sidebar: 'Certificate Requests',
  name: 'CertificateRequest',
  component: CertificateRequestDetail,
});

registerRoute({
  path: '/cert-manager/certificaterequests',
  sidebar: 'Certificate Requests',
  name: 'CertificateRequests',
  component: CertificateRequestsList,
});

// 3. orders.acme.cert-manager.io
registerSidebarEntry({
  name: 'Orders',
  url: '/cert-manager/orders',
  parent: 'Cert-manager',
  label: 'Orders',
});

registerRoute({
  path: '/cert-manager/orders/:namespace/:name',
  sidebar: 'Orders',
  name: 'Order',
  component: OrderDetail,
});

registerRoute({
  path: '/cert-manager/orders',
  sidebar: 'Orders',
  name: 'Orders',
  component: OrdersList,
});

// 4. challenges.acme.cert-manager.io
registerSidebarEntry({
  name: 'Challenges',
  url: '/cert-manager/challenges',
  parent: 'Cert-manager',
  label: 'Challenges',
});

registerRoute({
  path: '/cert-manager/challenges/:namespace/:name',
  sidebar: 'Challenges',
  name: 'Challenge',
  component: ChallengeDetail,
});

registerRoute({
  path: '/cert-manager/challenges',
  sidebar: 'Challenges',
  name: 'Challenges',
  component: ChallengesList,
});

// 5. clusterissuers.cert-manager.io
registerSidebarEntry({
  name: 'Cluster Issuers',
  url: '/cert-manager/clusterissuers',
  parent: 'Cert-manager',
  label: 'Cluster Issuers',
});

registerRoute({
  path: '/cert-manager/clusterissuers/:name',
  sidebar: 'Cluster Issuers',
  name: 'ClusterIssuer',
  component: ClusterIssuerDetail,
});

registerRoute({
  path: '/cert-manager/clusterissuers',
  sidebar: 'Cluster Issuers',
  name: 'ClusterIssuers',
  component: ClusterIssuersList,
});

// 6. issuers.cert-manager.io
registerSidebarEntry({
  name: 'Issuers',
  url: '/cert-manager/issuers',
  parent: 'Cert-manager',
  label: 'Issuers',
});

registerRoute({
  path: '/cert-manager/issuers/:namespace/:name',
  sidebar: 'Issuers',
  name: 'Issuer',
  component: IssuerDetail,
});

registerRoute({
  path: '/cert-manager/issuers',
  sidebar: 'Issuers',
  name: 'Issuers',
  component: IssuersList,
});
