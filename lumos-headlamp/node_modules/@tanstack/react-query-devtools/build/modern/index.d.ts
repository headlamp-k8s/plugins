import { D as Devtools } from './ReactQueryDevtools-Cn7cKi7o.js';
import { D as DevtoolsPanel } from './ReactQueryDevtoolsPanel-D9deyZtU.js';
import 'react';
import '@tanstack/query-devtools';
import '@tanstack/react-query';

declare const ReactQueryDevtools: (typeof Devtools)['ReactQueryDevtools'];
declare const ReactQueryDevtoolsPanel: (typeof DevtoolsPanel)['ReactQueryDevtoolsPanel'];

export { ReactQueryDevtools, ReactQueryDevtoolsPanel };
