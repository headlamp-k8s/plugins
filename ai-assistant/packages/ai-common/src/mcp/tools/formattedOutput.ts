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

/** Structured payload rendered by MCP output components. */
export interface FormattedMCPData {
  /** Column labels for table data. */
  headers?: string[];
  /** Table rows whose cells align with {@link headers}. */
  rows?: unknown[][];
  /** Ordered entries for list output. */
  items?: Array<{
    /** Primary text displayed for the list entry. */
    text: string;
    /** Optional state or severity label for the entry. */
    status?: string;
    /** Optional secondary metadata displayed with the entry. */
    metadata?: string;
  }>;
  /** Plain text or code content for text-oriented output. */
  content?: string;
  /** Optional language identifier used for code highlighting. */
  language?: string;
  /** Additional formatter-specific structured data. */
  [key: string]: unknown;
}

/** AI-formatted representation of raw MCP tool output. */
export interface FormattedMCPOutput {
  /** Presentation type selected for the output. */
  type: 'table' | 'metrics' | 'list' | 'graph' | 'text' | 'error' | 'raw';
  /** Short heading displayed above the output. */
  title: string;
  /** Concise natural-language explanation of the result. */
  summary: string;
  /** Structured payload consumed by the selected presentation type. */
  data: FormattedMCPData;
  /** Optional noteworthy observations derived from the result. */
  insights?: string[];
  /** Optional cautions or anomalous conditions. */
  warnings?: string[];
  /** Optional follow-up actions suggested to the user. */
  actionable_items?: string[];
  /** Optional diagnostics about formatting and source output. */
  metadata?: {
    /** MCP tool that produced the raw output. */
    toolName: string;
    /** Raw output length in JavaScript string characters. */
    responseSize: number;
    /** Formatting duration in milliseconds. */
    processingTime: number;
    /** Estimated number of values or records in the structured data. */
    dataPoints?: number;
  };
}
