import { defineConfig, mergeConfig } from 'vitest/config';
import headlampConfig from '@kinvolk/headlamp-plugin/config/vite.config.mjs';

export default mergeConfig(
  headlampConfig,
  defineConfig({
    resolve: {
      alias: [
        {
          find: /^@kinvolk\/headlamp-plugin\/lib\/k8s\/(.*)$/,
          replacement: '@kinvolk/headlamp-plugin/lib/lib/k8s/$1',
        },
        {
          find: '@kinvolk/headlamp-plugin/lib/k8s',
          replacement: '@kinvolk/headlamp-plugin/lib/lib/k8s',
        },
      ],
    },
  })
);
