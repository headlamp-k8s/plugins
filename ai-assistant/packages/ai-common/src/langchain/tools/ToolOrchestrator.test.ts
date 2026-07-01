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
import { RecommendedTool, ToolOrchestrator } from './ToolOrchestrator';

describe('ToolOrchestrator.groupToolsByExecutionStrategy', () => {
  const makeTool = (
    name: string,
    args: Record<string, any> = {},
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): RecommendedTool => ({
    name,
    description: `Description for ${name}`,
    arguments: args,
    priority,
    reason: `Reason for ${name}`,
  });

  it('classifies read-pattern tools as parallel', () => {
    const tools = [
      makeTool('get_pods'),
      makeTool('list_services'),
      makeTool('search_logs'),
      makeTool('describe_node'),
    ];
    const result = ToolOrchestrator.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(4);
    expect(result.sequential).toHaveLength(0);
  });

  it('classifies write-pattern tools as sequential', () => {
    const tools = [
      makeTool('create_deployment'),
      makeTool('delete_pod'),
      makeTool('update_service'),
      makeTool('apply_manifest'),
    ];
    const result = ToolOrchestrator.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(0);
    expect(result.sequential).toHaveLength(4);
  });

  it('classifies kubernetes_api_request with GET as parallel', () => {
    const tools = [makeTool('kubernetes_api_request', { method: 'GET', url: '/api/v1/pods' })];
    const result = ToolOrchestrator.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(1);
    expect(result.sequential).toHaveLength(0);
  });

  it('classifies kubernetes_api_request with POST as sequential', () => {
    const tools = [
      makeTool('kubernetes_api_request', { method: 'POST', url: '/api/v1/pods', body: '{}' }),
    ];
    const result = ToolOrchestrator.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(0);
    expect(result.sequential).toHaveLength(1);
  });

  it('classifies kubernetes_api_request with PUT as sequential', () => {
    const tools = [makeTool('kubernetes_api_request', { method: 'PUT', url: '/api/v1/pods/foo' })];
    const result = ToolOrchestrator.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(0);
    expect(result.sequential).toHaveLength(1);
  });

  it('classifies kubernetes_api_request with PATCH as sequential', () => {
    const tools = [
      makeTool('kubernetes_api_request', { method: 'PATCH', url: '/api/v1/pods/foo' }),
    ];
    const result = ToolOrchestrator.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(0);
    expect(result.sequential).toHaveLength(1);
  });

  it('classifies kubernetes_api_request with DELETE as sequential', () => {
    const tools = [
      makeTool('kubernetes_api_request', { method: 'DELETE', url: '/api/v1/pods/foo' }),
    ];
    const result = ToolOrchestrator.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(0);
    expect(result.sequential).toHaveLength(1);
  });

  it('handles mixed read and write tools', () => {
    const tools = [
      makeTool('get_pods', {}, 'high'),
      makeTool('create_deployment', {}, 'medium'),
      makeTool('list_services', {}, 'low'),
    ];
    const result = ToolOrchestrator.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(2);
    expect(result.sequential).toHaveLength(1);
    expect(result.parallel.map(t => t.name)).toEqual(['get_pods', 'list_services']);
    expect(result.sequential.map(t => t.name)).toEqual(['create_deployment']);
  });

  it('sorts tools by priority within groups', () => {
    const tools = [
      makeTool('get_logs', {}, 'low'),
      makeTool('get_pods', {}, 'high'),
      makeTool('get_services', {}, 'medium'),
    ];
    const result = ToolOrchestrator.groupToolsByExecutionStrategy(tools);
    expect(result.parallel.map(t => t.name)).toEqual(['get_pods', 'get_services', 'get_logs']);
  });

  it('returns empty arrays for empty input', () => {
    const result = ToolOrchestrator.groupToolsByExecutionStrategy([]);
    expect(result.parallel).toHaveLength(0);
    expect(result.sequential).toHaveLength(0);
  });

  it('treats unknown tools with no method as parallel by default', () => {
    const tools = [makeTool('custom_tool', { data: 'test' })];
    const result = ToolOrchestrator.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(1);
    expect(result.sequential).toHaveLength(0);
  });

  it('treats generic tools with GET method as parallel', () => {
    const tools = [makeTool('some_api_call', { method: 'GET' })];
    const result = ToolOrchestrator.groupToolsByExecutionStrategy(tools);
    expect(result.parallel).toHaveLength(1);
    expect(result.sequential).toHaveLength(0);
  });
});
