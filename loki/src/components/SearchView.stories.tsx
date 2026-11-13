import React from 'react';
import { HistoricalSearch } from './SearchView';

export default { title: 'Loki/Historical search', component: HistoricalSearch };
export const Unconfigured = () => <HistoricalSearch cluster="example-cluster" />;
