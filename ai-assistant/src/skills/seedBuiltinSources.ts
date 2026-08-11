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

import {
  createAksSkillsSource,
  reconcileBuiltinSkillSources,
} from '@headlamp-k8s/ai-common/skills/builtinSources';
import { getSkillsConfig } from '@headlamp-k8s/ai-common/skills/config';
import type { SkillSource } from '@headlamp-k8s/ai-common/skills/SkillLoader';
import { isAksDesktopHost } from '@headlamp-k8s/ai-ui/mcp/host';
import { pluginStore } from '../pluginState';

/** @returns Skill sources the current desktop host preconfigures. */
function getBuiltinSourcesForHost(): SkillSource[] {
  return isAksDesktopHost() ? [createAksSkillsSource()] : [];
}

/** Preconfigures host-provided skill sources and keeps their pinned refs current. */
export function seedBuiltinSkillSources(): void {
  const builtinSources = getBuiltinSourcesForHost();
  if (builtinSources.length === 0) return;

  try {
    const stored = pluginStore.get();
    const result = reconcileBuiltinSkillSources(
      getSkillsConfig(stored),
      builtinSources,
      stored?.seededBuiltinSkillSources
    );
    if (!result.changed) return;

    pluginStore.update({
      skills: result.config,
      seededBuiltinSkillSources: result.state,
    });
  } catch (error) {
    console.error('Error preconfiguring built-in skill sources:', error);
  }
}
