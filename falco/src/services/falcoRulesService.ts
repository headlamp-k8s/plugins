import { ResourceClasses } from '@kinvolk/headlamp-plugin/lib/k8s';
import Pod from '@kinvolk/headlamp-plugin/lib/lib/k8s/pod';
import { FalcoRule } from '../types/FalcoRule';
import { FALCO_LABEL_SELECTOR } from '../utils/constants';
import {
  cleanYamlText,
  extractRulesFromYaml,
  FALCO_CONFIG_PATH,
  FALCO_RULES_FALLBACK,
  getRulesFilesFromConfig,
} from '../utils/falcoRulesUtils';
import { PodExecService } from './podExecService';

/**
 * Service for fetching and processing Falco rules from the cluster
 */
export class FalcoRulesService {
  /**
   * Fetch all Falco pods in the cluster with the specified label selector
   * @returns List of Falco pods
   */
  static async fetchFalcoPods(): Promise<Pod[]> {
    return new Promise((resolve, reject) => {
      ResourceClasses.Pod.apiList(
        (pods: Pod[]) => resolve(pods),
        (err: unknown) => reject(err),
        { queryParams: { labelSelector: FALCO_LABEL_SELECTOR } }
      )();
    });
  }

  /**
   * Get Falco config from a pod
   * @param pod The pod to get the config from
   * @returns Rules files paths from the config
   */
  static async getFalcoConfig(pod: Pod): Promise<string[]> {
    try {
      const configYaml = await PodExecService.readFile(pod, FALCO_CONFIG_PATH);
      const cleanConfigYaml = cleanYamlText(configYaml);
      const rulesFiles = getRulesFilesFromConfig(cleanConfigYaml);

      return rulesFiles.length > 0 ? rulesFiles : [FALCO_RULES_FALLBACK];
    } catch (err) {
      console.warn(`Failed to read config from pod ${pod.metadata?.name}:`, err);
      // If config file not found, fallback to default rules file
      return [FALCO_RULES_FALLBACK];
    }
  }

  /**
   * Get rules from a specific file in a pod
   * @param pod The pod to get the rules from
   * @param ruleFile The rule file path
   * @returns List of Falco rules
   */
  static async getRulesFromFile(pod: Pod, ruleFile: string): Promise<FalcoRule[]> {
    try {
      const rulesYaml = await PodExecService.readFile(pod, ruleFile);
      const cleanRulesYaml = cleanYamlText(rulesYaml);

      const parsedRules = extractRulesFromYaml(cleanRulesYaml, `${pod.metadata?.name}:${ruleFile}`);

      console.log(
        `[FalcoRules Debug] Loaded ${parsedRules.length} rules from ${ruleFile} in pod ${pod.metadata?.name}`
      );

      return parsedRules;
    } catch (err) {
      console.warn(`Failed to read rules from file ${ruleFile} in pod ${pod.metadata?.name}:`, err);
      return [];
    }
  }

  /**
   * Fetch all Falco rules from all pods in the cluster
   * @returns List of all Falco rules
   */
  static async fetchAllRules(): Promise<FalcoRule[]> {
    const pods = await this.fetchFalcoPods();
    if (!pods || pods.length === 0) {
      throw new Error('No Falco pods found in the cluster.');
    }

    const allRules: FalcoRule[] = [];

    for (const pod of pods) {
      const rulesFiles = await this.getFalcoConfig(pod);

      for (const ruleFile of rulesFiles) {
        const rules = await this.getRulesFromFile(pod, ruleFile);
        allRules.push(...rules);
      }
    }

    console.log(`[FalcoRules Debug] Total rules loaded: ${allRules.length}`);
    return allRules;
  }
}
