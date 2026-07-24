import tailwindcss from '@tailwindcss/vite';
import IconsResolver from 'unplugin-icons/resolver';
import ViteComponents from 'unplugin-vue-components/vite';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['./assets/css/main.css'],
  modules: [
    'unplugin-icons/nuxt',
  ],
  vite: {
    plugins: [
      tailwindcss(),
      ViteComponents({
        resolvers: [
          IconsResolver({
            prefix: '',
            strict: true,
          }),
        ],
        dts: true,
      }),
    ],
  },
});
