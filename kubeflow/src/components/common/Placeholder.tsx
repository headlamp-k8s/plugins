/**
 * Copyright 2025 The Headlamp Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React from 'react';
import { SectionPage } from './SectionPage';

interface Props {
  title: string;
  apiPath: string;
}

export function PlaceholderPage({ title, apiPath }: Props) {
  return (
    <SectionPage title={title} apiPath={apiPath}>
      <div style={{ padding: '20px' }}>
        <h1>{title}</h1>
        <p>
          This is a placeholder page for <strong>{title}</strong>.
        </p>
        <p>
          The required API group (`{apiPath}`) has been detected successfully. The list and detail
          views are planned for implementation.
        </p>
      </div>
    </SectionPage>
  );
}
