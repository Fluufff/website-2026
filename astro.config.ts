import { defineConfig, envField, fontProviders } from 'astro/config'
import icon from 'astro-icon'
import favicons from 'astro-favicons'
import vue from '@astrojs/vue'
import Icons from 'unplugin-icons/vite'
import { FileSystemHMRIconLoader } from 'unplugin-icons/loaders'

import brix, { brixFilled } from './utils/brix-icon-loader.ts'

import tailwindcss from '@tailwindcss/vite'

// deno-lint-ignore no-process-global
const getenv = (name: string) => (typeof Deno !== 'undefined' ? Deno.env.get(name) : process.env[name])

// https://astro.build/config
export default defineConfig({
  site: getenv('SITE')!,
  base: getenv('SITE_BASE_URL')!,
  integrations: [icon(), vue({ appEntrypoint: '/src/app.ts' }), favicons()],

  env: {
    schema: {
      SITE_BASE_URL: envField.string({
        context: 'server',
        access: 'public',
        endsWith: '/'
      })
    }
  },

  vite: {
    plugins: [
      Icons({
        compiler: 'vue3',
        customCollections: { brix, brixFilled, ...FileSystemHMRIconLoader('src/icons', 'custom') }
      }),
      tailwindcss()
    ],
    css: {
      devSourcemap: true
    }
  },

  experimental: {
    fonts: [
      {
        name: 'Inter',
        provider: fontProviders.google(),
        cssVariable: '--font-inter',
        weights: [400, 600, 700],
        subsets: ['latin'],
        styles: ['normal']
      },
      {
        name: 'Gatsby Gilmour',
        provider: 'local',
        cssVariable: '--font-gatsby',
        variants: [
          {
            weight: 400,
            style: 'normal',
            src: [
              './src/assets/fonts/gatsby_gilmour/GatsbyGilmour-Regular.woff2',
              './src/assets/fonts/gatsby_gilmour/GatsbyGilmour-Regular.woff'
            ]
          }
        ]
      },
      {
        name: 'Atari',
        provider: 'local',
        cssVariable: '--font-atari',
        variants: [
          {
            weight: 400,
            style: 'normal',
            src: [
              './src/assets/fonts/atari/AtariFontFullVersion.woff2',
              './src/assets/fonts/atari/AtariFontFullVersion.woff'
            ]
          }
        ]
      },
      {
        name: 'Video Game',
        provider: 'local',
        cssVariable: '--font-video-game',
        variants: [
          {
            weight: 400,
            style: 'normal',
            src: ['./src/assets/fonts/video_game/VideoGame.woff2', './src/assets/fonts/video_game/VideoGame.woff']
          }
        ]
      }
    ]
  }
})
