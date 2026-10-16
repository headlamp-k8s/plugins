export const nrcRoutePaths = {
  rulesList: '/nrc/rules',
  ruleDetail: '/nrc/rules/:name',
  overview: '/nrc',
} as const;

export const nrcRouteNames = {
  rulesList: 'Readiness Rules',
  ruleDetail: 'nrc-rule-details',
  overview: 'nrc-overview',
} as const;

export const nrcSidebarNames = {
  root: 'nrc-plugin',
  rulesList: 'nrc-rules-list',
  overview: 'nrc-overview',
} as const;

export function createRuleDetailURL(name: string): string {
  return `/nrc/rules/${encodeURIComponent(name)}`;
}
