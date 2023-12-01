import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import copy from 'rollup-plugin-copy'
import inject from "@rollup/plugin-inject";
import commonjs from '@rollup/plugin-commonjs';

const commonjsPackages = ['image-data-uri']

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    watch: {
      ignored: ["node_modules/**"]
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), inject({
      $: 'jquery',
      jQuery: 'jquery'
    }), commonjs()], 
    optimizeDeps: {
      exclude: ['bootbox', 'Jimp/es']
    },
    watch: {
      ignored: ["node_modules/**"]
    }
  },
  pyflask: {
    resolve: {
      alias: {
        '@pyflask': resolve('src/pyflask')
      }
    },
    plugins: [
      copy({
        targets: [
          { src: 'src/pyflask/src', dest: '/out/pyflask/*' }
        ]
      })
    ]
  },

})
