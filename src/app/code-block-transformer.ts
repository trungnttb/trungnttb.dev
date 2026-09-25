import type { ShikiTransformer } from 'shiki';
import { t } from '../i18n';

/** Wraps every highlighted block in a frame with a language label and a copy button. */
export function codeBlockTransformer(): ShikiTransformer {
  return {
    name: 'portfolio:code-block',
    root(root) {
      const lang = this.options.lang;
      return {
        type: 'root',
        children: [
          {
            type: 'element',
            tagName: 'div',
            properties: { class: 'code-block', 'data-lang': lang },
            children: [
              {
                type: 'element',
                tagName: 'div',
                properties: { class: 'code-block-bar' },
                children: [
                  { type: 'element', tagName: 'span', properties: { class: 'code-block-lang' }, children: [{ type: 'text', value: lang }] },
                  {
                    type: 'element',
                    tagName: 'button',
                    properties: { type: 'button', class: 'code-block-copy', 'data-copy-code': '' },
                    children: [{ type: 'text', value: t('code.copy') }],
                  },
                ],
              },
              ...root.children,
            ],
          },
        ],
      } as typeof root;
    },
  };
}
