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
import { ParsedSkill } from '../parseSkill';
import {
  computeRelevanceScore,
  DEFAULT_ROUTER_CONFIG,
  routeAndFormatSkills,
  routeSkills,
  scoreSkills,
  tokenize,
} from './KeywordSkillRouter';

const encoder = new TextEncoder();

/** Helper to create a minimal ParsedSkill for testing. */
function makeSkill(
  name: string,
  description: string,
  content: string = `Content for ${name}`,
  tags?: string[]
): ParsedSkill {
  return {
    metadata: { name, description, ...(tags ? { tags } : {}) },
    content,
    contentSizeBytes: encoder.encode(content).length,
    source: `test/${name}/SKILL.md`,
  };
}

describe('SkillRouter', () => {
  // ──────────────────────────────────────────────────────────────────────
  // tokenize
  // ──────────────────────────────────────────────────────────────────────
  describe('tokenize', () => {
    it('splits into lowercase tokens', () => {
      const tokens = tokenize('Hello World');
      expect(tokens).toContain('hello');
      expect(tokens).toContain('world');
    });

    it('removes stop words', () => {
      const tokens = tokenize('create a pull request for the branch');
      expect(tokens).not.toContain('a');
      expect(tokens).not.toContain('for');
      expect(tokens).not.toContain('the');
      expect(tokens).toContain('create');
      expect(tokens).toContain('pull');
      expect(tokens).toContain('request');
      expect(tokens).toContain('branch');
    });

    it('deduplicates tokens', () => {
      const tokens = tokenize('test test test testing');
      expect(tokens.filter(t => t === 'test')).toHaveLength(1);
    });

    it('handles punctuation', () => {
      const tokens = tokenize('rate-limiting, SDK. TypeScript!');
      expect(tokens).toContain('rate');
      expect(tokens).toContain('limiting');
      expect(tokens).toContain('sdk');
      expect(tokens).toContain('typescript');
    });

    it('preserves CJK characters', () => {
      const tokens = tokenize('CPU 飙高排查 JVM');
      expect(tokens).toContain('cpu');
      expect(tokens).toContain('jvm');
      // CJK chars are preserved (they pass the unicode range check)
      expect(tokens.some(t => t.includes('飙高排查'))).toBe(true);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // computeRelevanceScore
  // ──────────────────────────────────────────────────────────────────────
  describe('computeRelevanceScore', () => {
    it('returns 0 for empty query', () => {
      const score = computeRelevanceScore([], new Set(['hello']));
      expect(score).toBe(0);
    });

    it('returns 1 for perfect match', () => {
      const query = ['pull', 'request'];
      const doc = new Set(['pull', 'request', 'create']);
      expect(computeRelevanceScore(query, doc)).toBeGreaterThanOrEqual(1.0);
    });

    it('returns 0 for no match', () => {
      const query = ['kubernetes', 'pod'];
      const doc = new Set(['javascript', 'react', 'frontend']);
      expect(computeRelevanceScore(query, doc)).toBe(0);
    });

    it('returns partial score for partial match', () => {
      const query = ['pull', 'request', 'kubernetes'];
      const doc = new Set(['pull', 'request', 'create']);
      const score = computeRelevanceScore(query, doc);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(1);
    });

    it('handles partial token matches', () => {
      const query = ['ratelimit'];
      const doc = new Set(['rate', 'limit', 'sdk']);
      const score = computeRelevanceScore(query, doc);
      expect(score).toBeGreaterThan(0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // routeSkills
  // ──────────────────────────────────────────────────────────────────────
  describe('routeSkills', () => {
    const skills: ParsedSkill[] = [
      makeSkill('install', 'Kubeshark installation and deployment skill', 'Helm install content', [
        'kubeshark',
        'helm',
        'install',
      ]),
      makeSkill(
        'network-rca',
        'Kubernetes network root cause analysis with Kubeshark',
        'Snapshot and KFL content',
        ['kubernetes', 'network', 'rca']
      ),
      makeSkill(
        'helmfile',
        'Expert guidance for Helmfile declarative Helm chart deployment',
        'Helmfile content',
        ['helm', 'helmfile', 'deployment']
      ),
      makeSkill(
        'node-not-ready',
        'Troubleshoot NotReady or SchedulingDisabled node status',
        'Node troubleshooting',
        ['kubernetes', 'node', 'troubleshooting']
      ),
      makeSkill(
        'pod-failure-diagnosis',
        'Troubleshoot CrashLoopBackOff, ImagePullBackOff, Pending, Error, or OOMKilled',
        'Pod troubleshooting',
        ['kubernetes', 'pod', 'crashloop']
      ),
      makeSkill('kubernetes-security', 'Kubernetes RBAC and security', 'K8s security', [
        'kubernetes',
        'security',
      ]),
    ];

    it('returns all skills when count is below maxSkills', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 10 };
      const result = routeSkills('anything', skills, config);
      expect(result).toHaveLength(6);
    });

    it('selects install skill for Kubeshark install query', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 3 };
      const result = routeSkills('install kubeshark on my cluster', skills, config);
      const names = result.map(s => s.metadata.name);
      expect(names).toContain('install');
    });

    it('selects network-rca skill for network analysis query', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 3 };
      const result = routeSkills('analyze network traffic root cause', skills, config);
      const names = result.map(s => s.metadata.name);
      expect(names).toContain('network-rca');
    });

    it('selects helmfile skill for Helm deployment query', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 3 };
      const result = routeSkills('deploy helm charts with helmfile', skills, config);
      const names = result.map(s => s.metadata.name);
      expect(names).toContain('helmfile');
    });

    it('selects node troubleshooting skill for node issues', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 3 };
      const result = routeSkills('node NotReady SchedulingDisabled', skills, config);
      const names = result.map(s => s.metadata.name);
      expect(names).toContain('node-not-ready');
    });

    it('selects pod failure skill for crashloop queries', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 3 };
      const result = routeSkills('pod CrashLoopBackOff OOMKilled', skills, config);
      const names = result.map(s => s.metadata.name);
      expect(names).toContain('pod-failure-diagnosis');
    });

    it('respects maxSkills limit', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 2 };
      const result = routeSkills('kubernetes', skills, config);
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('respects minScore threshold', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 5, minScore: 0.95 };
      const result = routeSkills('completely unrelated foobar xyz topic', skills, config);
      // No K8s skills should match an unrelated query at a very high threshold
      expect(result.length).toBe(0);
    });

    it('respects byte budget', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 5, maxTotalBytes: 200 };
      const result = routeSkills('kubernetes', skills, config);
      const totalBytes = result.reduce((sum, s) => sum + s.contentSizeBytes, 0);
      expect(totalBytes).toBeLessThanOrEqual(200);
    });

    it('returns up to maxSkills for empty query', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 3 };
      const result = routeSkills('', skills, config);
      expect(result.length).toBeLessThanOrEqual(3);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // scoreSkills
  // ──────────────────────────────────────────────────────────────────────
  describe('scoreSkills', () => {
    const skills: ParsedSkill[] = [
      makeSkill('install', 'Kubeshark installation and deployment', 'Install content', [
        'kubeshark',
      ]),
      makeSkill('helmfile', 'Helmfile declarative Helm deployment', 'Helmfile content', ['helm']),
      makeSkill('node-not-ready', 'Kubernetes node troubleshooting', 'Node content', [
        'kubernetes',
      ]),
    ];

    it('returns all skills with scores', () => {
      const scored = scoreSkills('install kubeshark', skills);
      expect(scored).toHaveLength(3);
      expect(scored[0].score).toBeGreaterThanOrEqual(scored[1].score);
    });

    it('ranks most relevant skill first', () => {
      const scored = scoreSkills('install kubeshark', skills);
      expect(scored[0].skill.metadata.name).toBe('install');
    });

    it('gives higher score to better matches', () => {
      const scored = scoreSkills('kubernetes node troubleshooting', skills);
      const nodeScore = scored.find(s => s.skill.metadata.name === 'node-not-ready')!.score;
      const installScore = scored.find(s => s.skill.metadata.name === 'install')!.score;
      expect(nodeScore).toBeGreaterThan(installScore);
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // routeAndFormatSkills
  // ──────────────────────────────────────────────────────────────────────
  describe('routeAndFormatSkills', () => {
    const skills: ParsedSkill[] = [
      makeSkill(
        'install',
        'Kubeshark installation and deployment',
        'Install workflow instructions'
      ),
      makeSkill('network-rca', 'Kubernetes network root cause analysis', 'RCA instructions'),
      makeSkill('helmfile', 'Helmfile declarative Helm deployment', 'Helmfile content'),
      makeSkill(
        'node-not-ready',
        'Kubernetes node troubleshooting NotReady',
        'Node troubleshooting content'
      ),
      makeSkill(
        'pod-failure-diagnosis',
        'Pod CrashLoopBackOff troubleshooting',
        'Pod troubleshooting content'
      ),
      makeSkill('kubernetes-security', 'Kubernetes RBAC security', 'Security content'),
    ];

    it('formats only relevant skills for install query', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 2 };
      const prompt = routeAndFormatSkills('install kubeshark', skills, config);
      expect(prompt).toContain('<skill name="install"');
      expect(prompt).toContain('SKILLS:');
    });

    it('formats only relevant skills for kubernetes security query', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 2 };
      const prompt = routeAndFormatSkills('kubernetes security RBAC', skills, config);
      expect(prompt).toContain('<skill name="kubernetes-security"');
    });

    it('returns empty string when no skills match', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 2, minScore: 0.99 };
      const prompt = routeAndFormatSkills('completely unrelated topic xyz', skills, config);
      // With very high minScore, nothing should match
      expect(prompt).toBe('');
    });
  });

  // ──────────────────────────────────────────────────────────────────────
  // Real-world Kubernetes skills routing
  // ──────────────────────────────────────────────────────────────────────
  describe('routing with real-world Kubernetes skills', () => {
    const repoSkills: ParsedSkill[] = [
      // kubeshark
      makeSkill(
        'install',
        'Kubeshark installation and deployment skill. Use this skill whenever the user wants to install Kubeshark, deploy Kubeshark to a Kubernetes cluster, set up Kubeshark, configure Kubeshark helm values, or manage the Kubeshark Helm release.',
        'Helm install, kubeshark tap, kubectl, deployment'
      ),
      makeSkill(
        'network-rca',
        'Kubernetes network root cause analysis skill powered by Kubeshark MCP. Use this skill whenever the user wants to investigate past incidents, perform retrospective traffic analysis, take or manage traffic snapshots, extract PCAPs, dissect L7 API calls.',
        'Snapshot KFL forensics PCAP network traffic analysis'
      ),
      // helmfile
      makeSkill(
        'helmfile',
        'Expert guidance for Helmfile declarative Helm chart deployment',
        'Helmfile releases repositories environments values'
      ),
      // openshift lightspeed
      makeSkill(
        'node-not-ready',
        'Troubleshoot NotReady or SchedulingDisabled node status. Use when a node is down, unschedulable, or needs to be drained and restored.',
        'Node conditions MemoryPressure DiskPressure kubelet CSR'
      ),
      makeSkill(
        'pod-failure-diagnosis',
        'Troubleshoot CrashLoopBackOff, ImagePullBackOff, Pending, Error, or OOMKilled status. Use when a workload keeps restarting, fails to start, or is crash-looping.',
        'Pod status CrashLoopBackOff ImagePullBackOff OOMKilled Pending'
      ),
    ];

    it('selects install skill when asking about Kubeshark deployment', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 2 };
      const result = routeSkills('How do I install Kubeshark on my cluster?', repoSkills, config);
      expect(result[0].metadata.name).toBe('install');
    });

    it('selects network-rca skill for traffic analysis queries', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 2 };
      const result = routeSkills('analyze network traffic snapshot PCAP', repoSkills, config);
      expect(result[0].metadata.name).toBe('network-rca');
    });

    it('selects helmfile skill for Helm chart queries', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 2 };
      const result = routeSkills('deploy helm charts with helmfile releases', repoSkills, config);
      expect(result[0].metadata.name).toBe('helmfile');
    });

    it('selects node-not-ready skill for node issues', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 2 };
      const result = routeSkills('node NotReady kubelet down', repoSkills, config);
      expect(result[0].metadata.name).toBe('node-not-ready');
    });

    it('selects pod-failure skill for CrashLoopBackOff queries', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 2 };
      const result = routeSkills('pod CrashLoopBackOff OOMKilled', repoSkills, config);
      expect(result[0].metadata.name).toBe('pod-failure-diagnosis');
    });

    it('does not select all 5 skills for a specific query', () => {
      const config = { ...DEFAULT_ROUTER_CONFIG, maxSkills: 3, minScore: 0.2 };
      const result = routeSkills('install kubeshark', repoSkills, config);
      expect(result.length).toBeLessThanOrEqual(3);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
