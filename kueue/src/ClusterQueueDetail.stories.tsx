import React from 'react';
import { MemoryRouter, Route } from 'react-router-dom';
import ClusterQueueDetailView from './ClusterQueueDetailView';

export default {
  title: 'Kueue/ClusterQueueDetail',
  component: ClusterQueueDetailView,
};

export const Default = () => (
  <MemoryRouter initialEntries={['/kueue/clusterqueues/team-a-queue']}>
    <Route path="/kueue/clusterqueues/:name">
      <ClusterQueueDetailView />
    </Route>
  </MemoryRouter>
);