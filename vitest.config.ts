import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      // The composition root is covered by the browser smoke test (brick 5), not by unit tests.
      exclude: ['src/**/*.d.ts', 'src/app/main.ts'],
      reporter: ['text', 'lcov'],
      // Owner floor is 80 %; raise these as a ratchet once the domain lands, never lower them.
      thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
    },
  },
});
