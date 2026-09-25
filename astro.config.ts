import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { codeBlockTransformer } from './src/app/code-block-transformer';

// https://astro.build/config
export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: 'gruvbox-dark-medium',
      transformers: [codeBlockTransformer()],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
