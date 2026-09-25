import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { codeBlockTransformer } from './src/app/code-block-transformer';

// https://astro.build/config
export default defineConfig({
  markdown: {
    // Mermaid blocks stay as plain code so the client can render them as diagrams.
    syntaxHighlight: { type: 'shiki', excludeLangs: ['mermaid', 'math'] },
    shikiConfig: {
      theme: 'gruvbox-dark-medium',
      transformers: [codeBlockTransformer()],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
