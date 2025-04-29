
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.js'], // Create this file if it doesn't exist
    include: ['__tests__/**/*.{test,spec}.{js,jsx,ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      // Make sure to exclude test files and node_modules
      exclude: [
        'node_modules/**',
        'dist/**',
        '__tests__/**/*.{test,spec}.{js,jsx}'
      ]
    }
  }
});