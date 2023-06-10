import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  sourcemap: true,
  format: ['cjs', 'esm'],
  dts: true,
  splitting: true,
  target: [
    'chrome109',
    'edge112',
    'firefox111',
    'ios15.6',
    'node18',
    'opera97',
    'safari15.6',
  ]
})