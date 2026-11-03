/**
 * Canonical route paths used by the Node Readiness Controller plugin.
 */
export const nrcRoutePaths = {
  rulesList: '/nrc/rules',
  ruleDetail: '/nrc/rules/:name',
  evaluationsList: '/nrc/evaluations',
  evaluationDetail: '/nrc/evaluations/:name',
  overview: '/nrc',
} as const;

/**
 * Canonical route names registered in Headlamp.
 */
export const nrcRouteNames = {
  rulesList: 'Readiness Rules',
  ruleDetail: 'nrc-rule-details',
  evaluationsList: 'Node Evaluations',
  evaluationDetail: 'nrc-evaluation-details',
  overview: 'nrc-overview',
} as const;

/**
 * Sidebar entry identifiers registered in Headlamp.
 */
export const nrcSidebarNames = {
  root: 'nrc-plugin',
  rulesList: 'nrc-rules-list',
  evaluationsList: 'nrc-evaluations-list',
  overview: 'nrc-overview',
} as const;

/**
 * Generates the URL path to navigate to a specific NodeReadinessRule's detail page.
 *
 * @param name - The metadata name of the NodeReadinessRule.
 * @returns The encoded URL path string.
 */
export function createRuleDetailURL(name: string): string {
  return `/nrc/rules/${encodeURIComponent(name)}`;
}

/**
 * Generates the URL path to navigate to a specific NodeReadinessEvaluation's detail page.
 *
 * @param name - The metadata name of the NodeReadinessEvaluation.
 * @returns The encoded URL path string.
 */
export function createEvaluationDetailURL(name: string): string {
  return `/nrc/evaluations/${encodeURIComponent(name)}`;
}
