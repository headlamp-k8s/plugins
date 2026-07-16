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

import { describe, expect, it } from 'vitest';
import { getToolDescription } from './getToolDescription';

describe('getToolDescription', () => {
  describe('MCP tools', () => {
    it('returns tracing description for trace/profile tools', () => {
      expect(getToolDescription('gadget__trace_open', true)).toContain('Traces');
      expect(getToolDescription('cpu__profile_cpu', true)).toContain('Traces');
    });

    it('returns network description for network/socket tools', () => {
      expect(getToolDescription('gadget__network_graph', true)).toContain('network');
      expect(getToolDescription('gadget__socket_collector', true)).toContain('network');
    });

    it('returns process description for top/process tools', () => {
      expect(getToolDescription('gadget__top_tcp', true)).toContain('processes');
      expect(getToolDescription('ps__process_list', true)).toContain('processes');
    });

    it('returns exec description for exec/run tools (when no higher-priority keyword matches)', () => {
      // Use names that contain only the exec/run keyword, not trace/profile/network/top
      expect(getToolDescription('gadget__execve', true)).toContain('containers');
      expect(getToolDescription('run_command', true)).toContain('containers');
    });

    it('a tool with both exec and trace keywords: exec wins (more specific)', () => {
      // Bug fix: exec is now checked before trace so exec_tracer gets
      // the 'containers' (exec) description rather than the tracing description.
      const desc = getToolDescription('gadget__exec_tracer', true);
      expect(desc).toContain('containers');
    });

    it('returns generic Inspektor Gadget fallback for unknown MCP tools', () => {
      const desc = getToolDescription('gadget__some_unknown_tool', true);
      expect(desc).toContain('Inspektor Gadget');
      expect(desc).toContain('gadget__some_unknown_tool');
    });
  });

  describe('built-in tools', () => {
    it('returns Kubernetes API description for kubernetes tools', () => {
      expect(getToolDescription('kubernetes_api_request', false)).toContain('Kubernetes API');
    });

    it('returns generic management description for other built-in tools', () => {
      const desc = getToolDescription('some_builtin_tool', false);
      expect(desc).toContain('Kubernetes management tool');
      expect(desc).toContain('some_builtin_tool');
    });
  });

  describe('Bug: keyword matching uses substring so tool order matters', () => {
    it('a tool named "network_trace" matches trace first (whichever if-branch is first)', () => {
      // "network_trace" contains both 'trace' and 'network'.
      // The code checks 'trace' before 'network', so it returns the trace description.
      // This test documents the current priority order — change if intentional.
      const desc = getToolDescription('network_trace', true);
      expect(desc).toContain('Traces'); // trace wins because it's checked first
    });
  });
});
