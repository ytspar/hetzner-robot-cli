import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/cli.ts',
        'src/types.ts',
        'src/index.ts',
        'src/client.ts',
        'src/config.ts',
        'src/formatter.ts',
        'src/shared/helpers.ts',
        'src/robot/types.ts',
        'src/robot/commands/**',
        'src/cloud/types.ts',
        'src/cloud/commands/**',
        'src/auction/commands.ts',
      ],
      thresholds: {
        lines: 95,
        functions: 90,
        branches: 75,
        statements: 95,
      },
    },
  },
});
