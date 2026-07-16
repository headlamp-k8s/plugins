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
/* eslint-disable no-unused-vars */

/**
 * MockSkillManager — a lightweight stand-in for `SkillManager` for use in
 * tests and demos.
 *
 * It satisfies the two skill methods used by the assistant session:
 * - `loadAllSkills` — returns a canned (empty) list by default, or throws.
 * - `getRoutedSkillsPromptText` — returns a configurable skill prompt string.
 *
 * ### Usage
 *
 * ```ts
 * // Basic — returns '' for every query (skills disabled)
 * const mgr = createMockSkillManager();
 *
 * // Returns a fixed skill prompt for any query
 * const mgr = createMockSkillManager({ skillPrompt: '\n## Skill: k8s-debug\n...' });
 *
 * // Simulate skills loading error
 * const mgr = createMockSkillManager({ throwOnLoad: true });
 *
 * // Spy on which queries are routed
 * const queries: string[] = [];
 * const mgr = createMockSkillManager({ onRoute: q => queries.push(q) });
 * ```
 */

import type { SkillsConfig } from '../config';
import type { ParsedSkill } from '../parseSkill';

export interface MockSkillManagerOptions {
  /**
   * Text returned by `getRoutedSkillsPromptText` for every query.
   * Defaults to `''` (no skill injected).
   */
  skillPrompt?: string;

  /**
   * When `true`, `loadAllSkills` throws an `Error('MockSkillManager: load failed')`.
   * Lets tests exercise the graceful-degradation path in `getSkillsPromptForQuery`.
   */
  throwOnLoad?: boolean;

  /**
   * When `true`, `getRoutedSkillsPromptText` throws after loading succeeds.
   * Useful for testing the error path inside the routing step.
   */
  throwOnRoute?: boolean;

  /**
   * Optional spy called with the query string each time
   * `getRoutedSkillsPromptText` is invoked.
   *
   * @param query - Query passed to skill routing.
   * @returns No value.
   */
  onRoute?: (query: string) => void;
}

/**
 * Minimal mock that satisfies the `SkillManager` surface used by
 * assistant sessions. Construct with `createMockSkillManager()`.
 */
export class MockSkillManager {
  private readonly skillPrompt: string;
  private readonly throwOnLoad: boolean;
  private readonly throwOnRoute: boolean;
  private readonly onRoute?: (query: string) => void;

  /**
   * Creates a configurable skill-manager test double.
   *
   * @param options - Prompt, failure, and routing-spy behavior.
   */
  constructor(options: MockSkillManagerOptions = {}) {
    this.skillPrompt = options.skillPrompt ?? '';
    this.throwOnLoad = options.throwOnLoad ?? false;
    this.throwOnRoute = options.throwOnRoute ?? false;
    this.onRoute = options.onRoute;
  }

  /**
   * Resolves with an empty skill list, or throws when `throwOnLoad` is set.
   *
   * @param _config - Skills configuration accepted to match the real manager API.
   * @returns An empty parsed-skill list.
   */
  async loadAllSkills(_config: SkillsConfig): Promise<ParsedSkill[]> {
    if (this.throwOnLoad) throw new Error('MockSkillManager: load failed');
    return [];
  }

  /**
   * Returns the configured `skillPrompt`, or throws when `throwOnRoute` is set.
   * Invokes the optional `onRoute` spy with the query.
   *
   * @param query - Query passed to the route spy.
   * @param _config - Skills configuration accepted to match the real manager API.
   * @returns The configured skill prompt text.
   */
  async getRoutedSkillsPromptText(query: string, _config: SkillsConfig): Promise<string> {
    this.onRoute?.(query);
    if (this.throwOnRoute) throw new Error('MockSkillManager: route failed');
    return this.skillPrompt;
  }
}

/**
 * Creates a `MockSkillManager` with the given options.
 *
 * @example
 * ```ts
 * // Inject a fixed skill into every system prompt
 * const manager = createTestManager();
 * manager.setSkillManager(
 *   createMockSkillManager({ skillPrompt: '\n## Skill: k8s-debug\n...' }),
 *   defaultSkillsConfig
 * );
 * ```
 *
 * @param options - Prompt, failure, and routing-spy behavior.
 * @returns A configured mock skill manager.
 */
export function createMockSkillManager(options: MockSkillManagerOptions = {}): MockSkillManager {
  return new MockSkillManager(options);
}
