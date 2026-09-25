import { t } from '../i18n';

const RESET_MS = 1600;

async function writeClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch (error) {
      // Rejected when the document lacks focus or permission; the legacy path below may still work.
      console.warn('[copy] Clipboard API rejected, trying execCommand', error);
    }
  }
  // The async Clipboard API only exists on secure origins; plain-http previews fall back to execCommand.
  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.append(area);
  area.select();
  const ok = document.execCommand('copy');
  area.remove();
  if (!ok) throw new Error('execCommand copy returned false');
}

/** One delegated listener serves every code block, including ones fetched into the finder later. */
export function installCopyButtons(): void {
  document.addEventListener('click', async (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-copy-code]');
    if (!button) return;
    const code = button.closest('.code-block')?.querySelector('pre code');
    if (!code) return;
    try {
      await writeClipboard(code.textContent ?? '');
      button.textContent = t('code.copied');
      button.dataset.state = 'copied';
    } catch (error) {
      console.error('[copy] failed', error);
      button.textContent = t('code.copyFailed');
      button.dataset.state = 'failed';
    }
    window.setTimeout(() => {
      button.textContent = t('code.copy');
      delete button.dataset.state;
    }, RESET_MS);
  });
}
