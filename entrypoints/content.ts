import type { RuntimeMessage } from '../src/core/messages';
import { runFill } from '../src/automation/fill-runner';

export default defineContentScript({
  matches: [
    'https://*.myworkdayjobs.com/*',
    'https://jobs.lever.co/*',
    'https://boards.greenhouse.io/*',
    'https://job-boards.greenhouse.io/*',
    'https://jobs.ashbyhq.com/*',
    'https://bolt.eu/*',
    'https://wise.jobs/*',
    'https://*.sapsf.eu/*',
    'https://n26.com/*'
  ],
  allFrames: true,
  main() {
    if ((window as Window & { __jobApplierMounted?: boolean }).__jobApplierMounted) return;
    (window as Window & { __jobApplierMounted?: boolean }).__jobApplierMounted = true;
    let lastStage = stageFingerprint();
    const notifyPageReady = () => chrome.runtime.sendMessage({ type: 'PAGE_READY' }).catch(() => undefined);
    notifyPageReady();
    let pendingCheck: number | undefined;
    new MutationObserver(() => {
      window.clearTimeout(pendingCheck);
      pendingCheck = window.setTimeout(() => {
        const stage = stageFingerprint();
        if (stage !== lastStage) {
          lastStage = stage;
          notifyPageReady();
        }
      }, 250);
    }).observe(document.documentElement, { childList: true, subtree: true });
    chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
      if (message.type !== 'FILL_WORKDAY') return;
      runFill(message.profile, message.resume)
        .then((report) => sendResponse({ ok: true, report: report.items.map((item) => `${item.state}: ${item.field.label || item.field.intent} — ${item.message}`), nextAction: report.nextAction, provider: report.provider, stage: report.stage }))
        .catch((error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Unable to fill page.' }));
      return true;
    });
  }
});

function stageFingerprint(): string {
  const headings = Array.from(document.querySelectorAll<HTMLElement>('h1, h2, [role="heading"]'))
    .filter((heading) => Boolean(heading.getClientRects().length))
    .slice(0, 3)
    .map((heading) => heading.innerText.trim())
    .join('|');
  return `${location.pathname}|${headings}`;
}
