import { KubernetesTool } from './kubernetes';
import { ToolBase } from './ToolBase';

// To add a new tool, simply import it and add it to this array
export const AVAILABLE_TOOLS: Array<new () => ToolBase> = [
  KubernetesTool, // Main Kubernetes API tool
];

export function getToolByName(name: string, tools: ToolBase[]): ToolBase | undefined {
  return tools.find(tool => tool.config.name === name);
}
