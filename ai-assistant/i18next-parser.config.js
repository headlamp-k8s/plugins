import headlampConfig from '@kinvolk/headlamp-plugin/config/i18next-parser.config.js';

export default {
  ...headlampConfig,
  input: [
    'src/**/*.{ts,tsx}',
    'packages/ai-ui/src/**/*.{ts,tsx}',
    '!**/*.{test,stories}.{ts,tsx}',
    '!packages/ai-ui/src/testing/**',
  ],
  createOldCatalogs: false,
};
