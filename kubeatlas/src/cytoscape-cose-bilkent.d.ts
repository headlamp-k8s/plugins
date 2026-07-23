/*
 * Copyright 2026 The KubeAtlas Authors
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

// cytoscape-cose-bilkent ships no type declarations of its own; it is
// a cytoscape layout extension registered via cytoscape.use().
declare module 'cytoscape-cose-bilkent' {
  import { Ext } from 'cytoscape';

  const coseBilkent: Ext;
  export default coseBilkent;
}
