import { registerRoute, registerSidebarEntry } from '@kinvolk/headlamp-plugin/lib';
import { CertificateRequestDetail } from './components/certificateRequests/Detail';
import { CertificateRequestsList } from './components/certificateRequests/List';
import { CertificateDetail } from './components/certificates/Detail';
import { CertificatesList } from './components/certificates/List';
import { ChallengeDetail } from './components/challenges/Detail';
import { ChallengesList } from './components/challenges/List';
import { ClusterIssuerDetail } from './components/clusterIssuers/Detail';
import { ClusterIssuersList } from './components/clusterIssuers/List';
import { IssuerDetail } from './components/issuers/Detail';
import { IssuersList } from './components/issuers/List';
import { OrderDetail } from './components/orders/Detail';
import { OrdersList } from './components/orders/List';

interface ResourceRegistrationConfig {
  name: string;
  path: string;
  DetailComponent: React.ComponentType<any>;
  ListComponent: React.ComponentType<any>;
  hasNamespace?: boolean;
}

function registerCertManagerResource(config: ResourceRegistrationConfig) {
  const { name, path, DetailComponent, ListComponent, hasNamespace = true } = config;

  // Register sidebar entry
  registerSidebarEntry({
    name,
    url: `/cert-manager/${path}`,
    parent: 'Cert-manager',
    label: name,
  });

  // Register detail route
  registerRoute({
    path: `/cert-manager/${path}/${hasNamespace ? ':namespace/:name' : ':name'}`,
    sidebar: name,
    name: name.slice(0, -1), // Remove 's' from plural form
    component: () => <DetailComponent />,
  });

  // Register list route
  registerRoute({
    path: `/cert-manager/${path}`,
    sidebar: name,
    name,
    component: () => <ListComponent />,
  });
}

// Main Cert-manager sidebar entry
registerSidebarEntry({
  name: 'Cert-manager',
  url: '/cert-manager/certificates',
  icon: 'mdi:certificate',
  parent: '',
  label: 'cert-manager',
});

// Register all resources
registerCertManagerResource({
  name: 'Certificates',
  path: 'certificates',
  DetailComponent: CertificateDetail,
  ListComponent: CertificatesList,
});

registerCertManagerResource({
  name: 'Certificate Requests',
  path: 'certificaterequests',
  DetailComponent: CertificateRequestDetail,
  ListComponent: CertificateRequestsList,
});

registerCertManagerResource({
  name: 'Orders',
  path: 'orders',
  DetailComponent: OrderDetail,
  ListComponent: OrdersList,
});

registerCertManagerResource({
  name: 'Challenges',
  path: 'challenges',
  DetailComponent: ChallengeDetail,
  ListComponent: ChallengesList,
});

registerCertManagerResource({
  name: 'Cluster Issuers',
  path: 'clusterissuers',
  DetailComponent: ClusterIssuerDetail,
  ListComponent: ClusterIssuersList,
  hasNamespace: false,
});

registerCertManagerResource({
  name: 'Issuers',
  path: 'issuers',
  DetailComponent: IssuerDetail,
  ListComponent: IssuersList,
});
