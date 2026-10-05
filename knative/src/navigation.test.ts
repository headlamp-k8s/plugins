/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { knativeNavigationItems, knativeNavigationSections } from './navigation';

describe('Knative navigation', () => {
  it('keeps the expected section and item order', () => {
    expect(
      knativeNavigationSections.map(section => ({
        label: section.label,
        items: section.items.map(item => item.label),
      }))
    ).toEqual([
      {
        label: 'Serving',
        items: ['Services', 'Revisions', 'Domain Mappings', 'Cluster Domain Claims'],
      },
      {
        label: 'Serving Internals',
        items: [
          'Configurations',
          'Routes',
          'Images',
          'Pod Autoscalers',
          'Metrics',
          'KIngresses',
          'Serverless Services',
          'Certificates',
        ],
      },
      { label: 'Configuration', items: ['Networking'] },
    ]);
  });

  it('uses unique explicit sidebar, path, and route identifiers', () => {
    const sectionNames = knativeNavigationSections.map(section => section.name);
    const itemNames = knativeNavigationItems.map(item => item.name);
    const paths = knativeNavigationItems.map(item => item.path);
    const routeNames = knativeNavigationItems.map(item => item.routeName);

    expect(new Set(sectionNames).size).toBe(sectionNames.length);
    expect(new Set(itemNames).size).toBe(itemNames.length);
    expect(new Set(paths).size).toBe(paths.length);
    expect(new Set(routeNames).size).toBe(routeNames.length);
    expect(knativeNavigationItems.every(item => item.path.startsWith('/knative/'))).toBe(true);
  });
});
