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

/** Minimal embedding operations required by semantic routers. */
export interface EmbeddingProvider {
  /**
   * Embeds a batch of indexable documents.
   *
   * @param texts - Document text in the order it should be embedded.
   * @returns One embedding vector for each supplied document.
   */
  embedDocuments(texts: string[]): Promise<number[][]>;

  /**
   * Embeds a single search query.
   *
   * @param text - Query text to embed for similarity scoring.
   * @returns The query embedding vector.
   */
  embedQuery(text: string): Promise<number[]>;
}
