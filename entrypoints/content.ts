import type { RuntimeMessage } from '../src/core/messages';
import { runFill } from '../src/automation/fill-runner';

export default defineContentScript({
  matches: [
    'https://*.myworkdayjobs.com/*',
    'https://jobs.lever.co/*',
    'https://boards.greenhouse.io/*',
    'https://job-boards.greenhouse.io/*',
    'https://jobs.ashbyhq.com/*'
  ],
  main() {
    chrome.runtime.sendMessage({ type: 'PAGE_READY' }).catch(() => undefined);
    chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
      if (message.type !== 'FILL_WORKDAY') return;
      runFill(message.profile, message.resume)
        .then((report) => sendResponse({ ok: true, report: report.items.map((item) => `${item.state}: ${item.field.label || item.field.intent} — ${item.message}`), nextAction: report.nextAction, provider: report.provider }))
        .catch((error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Unable to fill page.' }));
      return true;
    });
  }
});
