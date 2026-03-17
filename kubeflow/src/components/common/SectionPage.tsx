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
import { useApiGroupInstalled } from '../../hooks/useKubeflowCheck';

interface Props {
  title: string;
  apiPath: string;
  children: React.ReactNode;
}

export function SectionPage({ title, apiPath, children }: Props) {
  const { isInstalled, isCheckLoading } = useApiGroupInstalled(apiPath);

  if (isCheckLoading) return <p>Checking cluster capabilities for {title}...</p>;
  if (!isInstalled)
    return <p>Required API group not detected for {title}. Are the CRDs installed?</p>;

  return <>{children}</>;
}
