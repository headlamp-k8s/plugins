/**
 * Detects the Falco file_output filename for a given pod.
 * @param podJson - The pod spec to parse.
 * @returns The file_output filename.
 */
export function detectFalcoFileOutputPath(podJson: any): string {
  // 1. Look for a container named 'falco' or the first container
  const containers = podJson?.spec?.containers || [];
  const falcoContainer = containers.find((c: any) => c.name === 'falco') || containers[0];
  if (!falcoContainer) return '/tmp/falco_events.json'; // fallback

  // 2. Check args for --falco.file_output.filename=...
  const args = falcoContainer.args || [];
  for (const arg of args) {
    if (arg.startsWith('--falco.file_output.filename=')) {
      return arg.split('=', 2)[1];
    }
  }

  // 3. Check env for FALCO_FILE_OUTPUT_FILENAME
  const env = falcoContainer.env || [];
  for (const envVar of env) {
    if (envVar.name === 'FALCO_FILE_OUTPUT_FILENAME' && envVar.value) {
      return envVar.value;
    }
  }

  // 4. Fallback
  return '/tmp/falco_events.json';
}
