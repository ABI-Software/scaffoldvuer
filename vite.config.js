import path from "path";
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const config = {
    css: {
        preprocessorOptions: {
          scss: {
            api: 'modern-compiler',
            additionalData: `@use '@/assets/styles' as *;`
          },
        },
    },
    plugins: [
        vue(),
        Components({
          // allow auto load markdown components under `./src/components/`
          extensions: ['vue', 'md'],
          // allow auto import and register components used in markdown
          include: [/\.vue$/, /\.vue\?vue/, /\.md$/],
          resolvers: [
            ElementPlusResolver({
              importStyle: 'sass',
            }),
          ],
          dts: 'src/components.d.ts',
        }),

        // https://github.com/antfu/unocss
        // see unocss.config.ts for config
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    build: {
      lib: {
        entry: path.resolve(__dirname, "./src/components/index.js"),
        name: "ScaffoldVuer",
        fileName: 'scaffoldvuer',
      },
      rollupOptions: {
        external: ["vue", "@abi-software/sparc-annotation", "@abi-software/svg-sprite", "@abi-software/map-utilities", "pinia"],
        output: {
          globals: {
            vue: "Vue",
            "@abi-software/sparc-annotation": "@abi-software/sparc-annotation",
            "@abi-software/svg-sprite": "@abi-software/svg-sprite",
            "@abi-software/map-utilities": "@abi-software/map-utilities",
            "pinia": "pinia"
          },
        },
      },
    },
  };

  if (command === 'serve') {
    config.server =  {
      port: 8081,
    };
    config.define = {
      'process.env.HTTP_PROXY': 8081,
      global: 'globalThis',
      // If you want to exposes all env variables, which is not recommended
      // 'process.env': env
    };
    config.plugins.push(
      nodePolyfills({
        // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
        include: ['path']
      })
    );
  };
  return config;
})
