import type { RuntimeMessage, ResumeRecord } from '../src/core/messages';
import type { CandidateProfile } from '../src/core/profile';
import { matchingAttestationRule, normalizeText, profileValueForLabel } from '../src/core/field-mapping';

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
      fillCurrentPage(message.profile, message.resume)
        .then(sendResponse)
        .catch((error: unknown) => sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Unable to fill page.' }));
      return true;
    });
  }
});

function labelFor(element: HTMLInputElement | HTMLTextAreaElement): string {
  const labels = Array.from(element.labels ?? []).map((label) => label.textContent ?? '');
  const parentLabel = element.closest('label')?.textContent ?? '';
  const fieldset = element.closest('fieldset')?.querySelector('legend')?.textContent ?? '';
  const aria = element.getAttribute('aria-label') ?? '';
  const name = element.getAttribute('name') ?? '';
  const placeholder = element.getAttribute('placeholder') ?? '';
  return normalizeText([...labels, parentLabel, fieldset, aria, name, placeholder].join(' '));
}

function setValue(element: HTMLInputElement | HTMLTextAreaElement, value: string): boolean {
  if (!value || element.disabled || element.readOnly) return false;
  const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  descriptor?.set?.call(element, value);
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('blur', { bubbles: true }));
  return element.value === value;
}

function setResume(input: HTMLInputElement, resume: ResumeRecord): boolean {
  if (input.type !== 'file') return false;
  const comma = resume.dataUrl.indexOf(',');
  if (comma < 0) return false;
  const bytes = Uint8Array.from(atob(resume.dataUrl.slice(comma + 1)), (char) => char.charCodeAt(0));
  const file = new File([bytes], resume.name, { type: 'application/pdf' });
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return input.files?.length === 1;
}

async function fillCurrentPage(profile: CandidateProfile, resume?: ResumeRecord): Promise<{ ok: boolean; report: string[] }> {
  const report: string[] = [];
  const inputs = Array.from(document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea'));
  for (const input of inputs) {
    if (input instanceof HTMLInputElement && input.type === 'hidden') continue;
    if (input instanceof HTMLInputElement && input.type === 'file' && resume) {
      if (setResume(input, resume)) report.push(`Uploaded ${resume.name}`);
      continue;
    }
    const label = labelFor(input);
    if (input instanceof HTMLInputElement && (input.type === 'checkbox' || input.type === 'radio')) {
      const rule = matchingAttestationRule(label, profile.attestation_rules);
      if (rule && input.checked !== rule.answer) {
        input.click();
        report.push(`Applied approved declaration: ${rule.intent}`);
      }
      continue;
    }
    const value = profileValueForLabel(label, profile);
    if (value && setValue(input, value)) report.push(`Filled ${label}`);
  }
  const blocked = inputs.filter((input) => {
    if (!(input.required || input.getAttribute('aria-required') === 'true')) return false;
    if (input instanceof HTMLInputElement && (input.type === 'checkbox' || input.type === 'radio')) return !input.checked;
    if (input instanceof HTMLInputElement && input.type === 'file') return !(input.files?.length);
    return !input.value;
  });
  if (blocked.length) {
    report.push(`${blocked.length} required visible field(s) still need review.`);
    return { ok: true, report };
  }
  const next = Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((button) => {
    const text = normalizeText(button.innerText);
    return !button.disabled && /^(next|continue|save and continue)$/.test(text);
  });
  if (next && report.length) {
    next.click();
    report.push('Advanced to the next step.');
  }
  return { ok: true, report: report.length ? report : ['No supported fields were visible on this page yet.'] };
}
