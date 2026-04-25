// ag-ui types for Holmes agent communication.
// Event types and protocol types are provided by @ag-ui/client and @ag-ui/core.
// This file only defines types specific to the Headlamp–Holmes integration.

export interface HolmesServiceInfo {
  namespace: string;
  service: string;
  port: number;
}
