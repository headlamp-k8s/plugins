import {
  registerRoute,
  registerSidebarEntry,
  registerSidebarEntryFilter,
  Utils,
} from '@kinvolk/headlamp-plugin/lib';
import React from 'react';
import MongoDBCommunityDetail from './components/Detail';
import MongoDBCommunityList from './components/List';
import { checkMongoDBCommunityCRD, isMongoDBCommunityInstalled } from './utils/crdDetection';
import { mongoRouteNames, mongoRoutePaths } from './utils/routes';

// Top-level MongoDB section in Headlamp sidebar
registerSidebarEntry({
  parent: null,
  name: 'mongodb',
  label: 'MongoDB',
  icon: 'mdi:database',
  url: mongoRoutePaths.communityList,
});

// MongoDB Community replica sets entry
registerSidebarEntry({
  parent: 'mongodb',
  name: 'mongodb-community',
  label: 'Community',
  url: mongoRoutePaths.communityList,
});

// Route: MongoDBCommunity List view
registerRoute({
  path: mongoRoutePaths.communityList,
  sidebar: 'mongodb-community',
  name: mongoRouteNames.communityList,
  exact: true,
  component: () => <MongoDBCommunityList />,
});

// Route: MongoDBCommunity Detail view
registerRoute({
  path: mongoRoutePaths.communityDetail,
  sidebar: 'mongodb-community',
  name: mongoRouteNames.communityDetail,
  exact: true,
  component: () => <MongoDBCommunityDetail />,
});

// Sidebar entry filter: hide MongoDB navigation if the CRD is absent on the current cluster
registerSidebarEntryFilter(entry => {
  if (entry.name !== 'mongodb' && entry.parent !== 'mongodb') {
    return entry;
  }

  const cluster = Utils.getCluster() ?? '';
  checkMongoDBCommunityCRD(cluster);

  const installed = isMongoDBCommunityInstalled(cluster);
  if (installed === false) {
    return null;
  }

  return entry;
});
