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
import {
  buildToolSearchText,
  computeRelevanceScore,
  DEFAULT_TOOL_ROUTER_CONFIG,
  routeTools,
  scoreTools,
  tokenize,
  ToolInfo,
} from './ToolRouter';

function makeTool(
  name: string,
  description: string,
  serverName: string = 'test-server',
  inputSchema?: Record<string, unknown>
): ToolInfo {
  return { name, description, serverName, inputSchema };
}

describe('MCPToolRouter', () => {
  describe('tokenize', () => {
    it('splits into lowercase tokens', () => {
      const tokens = tokenize('Hello World');
      expect(tokens).toContain('hello');
      expect(tokens).toContain('world');
    });

    it('removes stop words', () => {
      const tokens = tokenize('get the current namespace for the cluster');
      expect(tokens).not.toContain('the');
      expect(tokens).not.toContain('for');
      expect(tokens).toContain('get');
      expect(tokens).toContain('current');
      expect(tokens).toContain('namespace');
      expect(tokens).toContain('cluster');
    });

    it('deduplicates tokens', () => {
      const tokens = tokenize('pod pod pod pods');
      expect(tokens.filter(t => t === 'pod')).toHaveLength(1);
    });
  });

  describe('computeRelevanceScore', () => {
    it('returns 0 for empty query', () => {
      expect(computeRelevanceScore([], new Set(['hello']))).toBe(0);
    });

    it('returns 1 for perfect match', () => {
      const score = computeRelevanceScore(['list', 'pods'], new Set(['list', 'pods', 'namespace']));
      expect(score).toBeGreaterThanOrEqual(1.0);
    });

    it('returns 0 for no match', () => {
      expect(computeRelevanceScore(['kubernetes', 'pod'], new Set(['javascript', 'react']))).toBe(
        0
      );
    });

    it('handles partial token matches', () => {
      const score = computeRelevanceScore(['kubectl'], new Set(['kube', 'control']));
      expect(score).toBeGreaterThan(0);
    });
  });

  describe('buildToolSearchText', () => {
    it('includes name, server, and description', () => {
      const tool = makeTool(
        'kubectl-server__get_pods',
        'List pods in a namespace',
        'kubectl-server'
      );
      const text = buildToolSearchText(tool);
      expect(text).toContain('kubectl');
      expect(text).toContain('get');
      expect(text).toContain('pods');
      expect(text).toContain('List pods in a namespace');
    });

    it('includes schema property names', () => {
      const tool = makeTool('server__run_query', 'Run a query', 'server', {
        properties: { query: { type: 'string' }, namespace: { type: 'string' } },
      });
      const text = buildToolSearchText(tool);
      expect(text).toContain('query');
      expect(text).toContain('namespace');
    });
  });

  describe('routeMCPTools', () => {
    const tools: ToolInfo[] = [
      makeTool('kubectl__get_pods', 'List pods in a Kubernetes namespace', 'kubectl'),
      makeTool('kubectl__get_nodes', 'List nodes in the Kubernetes cluster', 'kubectl'),
      makeTool('kubectl__apply_manifest', 'Apply a Kubernetes YAML manifest', 'kubectl'),
      makeTool('helm__install_chart', 'Install a Helm chart on the cluster', 'helm'),
      makeTool('helm__list_releases', 'List Helm releases in a namespace', 'helm'),
      makeTool('docker__build_image', 'Build a Docker container image', 'docker'),
      makeTool('docker__push_image', 'Push a Docker image to a registry', 'docker'),
      makeTool('git__clone_repo', 'Clone a Git repository', 'git'),
      makeTool('git__list_branches', 'List branches in a Git repository', 'git'),
      makeTool('terraform__plan', 'Generate a Terraform execution plan', 'terraform'),
      makeTool('terraform__apply', 'Apply a Terraform plan', 'terraform'),
    ];

    it('returns all tools when count is below maxTools', () => {
      const config = { ...DEFAULT_TOOL_ROUTER_CONFIG, maxTools: 20 };
      const result = routeTools('anything', tools, config);
      expect(result).toHaveLength(11);
    });

    it('selects kubectl tools for pod-related query', () => {
      const config = { ...DEFAULT_TOOL_ROUTER_CONFIG, maxTools: 3 };
      const result = routeTools('list all pods in the kube-system namespace', tools, config);
      const names = result.map(t => t.name);
      expect(names).toContain('kubectl__get_pods');
    });

    it('selects helm tools for helm-related query', () => {
      const config = { ...DEFAULT_TOOL_ROUTER_CONFIG, maxTools: 3 };
      const result = routeTools('install a helm chart release', tools, config);
      const names = result.map(t => t.name);
      expect(names).toContain('helm__install_chart');
    });

    it('selects docker tools for docker-related query', () => {
      const config = { ...DEFAULT_TOOL_ROUTER_CONFIG, maxTools: 3 };
      const result = routeTools('build and push a docker image', tools, config);
      const names = result.map(t => t.name);
      expect(names).toContain('docker__build_image');
    });

    it('selects terraform tools for infra query', () => {
      const config = { ...DEFAULT_TOOL_ROUTER_CONFIG, maxTools: 3 };
      const result = routeTools('terraform plan apply infrastructure', tools, config);
      const names = result.map(t => t.name);
      expect(names).toContain('terraform__plan');
    });

    it('respects maxTools limit', () => {
      const config = { ...DEFAULT_TOOL_ROUTER_CONFIG, maxTools: 2 };
      const result = routeTools('kubernetes', tools, config);
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('respects minScore threshold', () => {
      const config = { ...DEFAULT_TOOL_ROUTER_CONFIG, maxTools: 5, minScore: 0.95 };
      const result = routeTools('completely unrelated foobar xyz', tools, config);
      expect(result.length).toBe(0);
    });

    it('returns up to maxTools for empty query', () => {
      const config = { ...DEFAULT_TOOL_ROUTER_CONFIG, maxTools: 3 };
      const result = routeTools('', tools, config);
      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  describe('scoreMCPTools', () => {
    const tools: ToolInfo[] = [
      makeTool('kubectl__get_pods', 'List pods in a namespace', 'kubectl'),
      makeTool('helm__install_chart', 'Install a Helm chart', 'helm'),
      makeTool('docker__build_image', 'Build a Docker image', 'docker'),
    ];

    it('returns all tools with scores', () => {
      const scored = scoreTools('list pods', tools);
      expect(scored).toHaveLength(3);
      expect(scored[0].score).toBeGreaterThanOrEqual(scored[1].score);
    });

    it('ranks most relevant tool first', () => {
      const scored = scoreTools('list pods namespace', tools);
      expect(scored[0].tool.name).toBe('kubectl__get_pods');
    });

    it('gives higher score to better matches', () => {
      const scored = scoreTools('docker build image', tools);
      const dockerScore = scored.find(s => s.tool.name === 'docker__build_image')!.score;
      const kubectlScore = scored.find(s => s.tool.name === 'kubectl__get_pods')!.score;
      expect(dockerScore).toBeGreaterThan(kubectlScore);
    });
  });
});
