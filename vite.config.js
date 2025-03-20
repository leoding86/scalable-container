import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  build: {
    target: "es2015",
    lib: {
      entry: resolve(__dirname, 'src/scalable-container.ts'),
      name: 'ScalableContainer',
      // the proper extensions will be added
      fileName: 'scalable-container',
      formats: ['iife']
    }
  },
})