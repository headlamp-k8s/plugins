import { MultiServerMCPClient } from "@langchain/mcp-adapters";

const client = new MultiServerMCPClient({
  // Global tool configuration options
  // Whether to throw on errors if a tool fails to load (optional, default: true)
  throwOnLoadError: true,
  // Whether to prefix tool names with the server name (optional, default: false)
  prefixToolNameWithServerName: false,
  // Optional additional prefix for tool names (optional, default: "")
  additionalToolNamePrefix: "",

  // Use standardized content block format in tool outputs
  useStandardContentBlocks: true,

  // Server configuration
  mcpServers: {
    // adds the Inspektor Gadget MCP server
    "inspektor-gadget": {
      transport: "stdio",
      command: "docker",
      args: [
        "run",
        "-i",
        "--rm",
        "--mount",
        "type=bind,src=${env:HOME}/.kube/config,dst=/kubeconfig",
        "ghcr.io/inspektor-gadget/ig-mcp-server:latest",
        "-gadget-discoverer=artifacthub"
      ],
      // Restart configuration for stdio transport
      restart: {
        enabled: true,
        maxAttempts: 3,
        delayMs: 2000, // Slightly longer delay for Docker container startup
      },
    },
  }
});

const tools = async function() {
    return await client.getTools();
};

export default tools;