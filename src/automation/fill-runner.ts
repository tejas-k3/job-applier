import { inspectControls } from '../adapters/form-inspector';
import { detectProvider } from '../adapters/provider';
import type { FillItem, FillReport, NormalizedField } from '../core/application';
import type { ResumeRecord } from '../core/messages';
import type { CandidateProfile } from '../core/profile';
import { matchingAttestationRule, profileValueForLabel } from '../core/field-mapping';

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function isFilled(control: Control): boolean {
  if (control instanceof HTMLInputElement && (control.type === 'checkbox' || control.type === 'radio')) return control.checked;
  if (control instanceof HTMLInputElement && control.type === 'file') return Boolean(control.files?.length);
  return Boolean(control.value);
}

function setValue(control: Control, value: string): boolean {
  if (!value || control.disabled || (!(control instanceof HTMLSelectElement) && control.readOnly)) return false;
  const prototype = control instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : control instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(prototype, 'value')?.set?.call(control, value);
  control.dispatchEvent(new Event('input', { bubbles: true }));
  control.dispatchEvent(new Event('change', { bubbles: true }));
  control.dispatchEvent(new Event('blur', { bubbles: true }));
  return control.value === value;
}

function setResume(control: HTMLInputElement, resume: ResumeRecord): boolean {
  if (control.type !== 'file') return false;
  const comma = resume.dataUrl.indexOf(',');
  if (comma < 0) return false;
  const bytes = Uint8Array.from(atob(resume.dataUrl.slice(comma + 1)), (char) => char.charCodeAt(0));
  const transfer = new DataTransfer();
  transfer.items.add(new File([bytes], resume.name, { type: 'application/pdf' }));
  control.files = transfer.files;
  control.dispatchEvent(new Event('input', { bubbles: true }));
  control.dispatchEvent(new Event('change', { bubbles: true }));
  return Boolean(control.files?.length);
}

async function settleCombobox(control: Control, value: string): Promise<void> {
  if (control.getAttribute('role') !== 'combobox') return;
  await new Promise((resolve) => setTimeout(resolve, 120));
  const options = Array.from(document.querySelectorAll<HTMLElement>('[role="option"]'));
  options.find((option) => option.innerText.trim().toLowerCase() === value.trim().toLowerCase())?.click();
}

function item(field: NormalizedField, state: FillItem['state'], message: string): FillItem {
  return { field, state, message };
}

export async function runFill(profile: CandidateProfile, resume?: ResumeRecord): Promise<FillReport> {
  const provider = detectProvider(location.href);
  const items: FillItem[] = [];
  const controls = inspectControls().filter(({ field }) => field.visible);

  for (const { control, field } of controls) {
    if (isFilled(control)) {
      items.push(item(field, 'already_present', 'Already present'));
      continue;
    }
    if (field.intent === 'resume') {
      if (resume && control instanceof HTMLInputElement && setResume(control, resume)) items.push(item(field, 'filled', `Uploaded ${resume.name}`));
      else items.push(item(field, 'blocked', 'Resume PDF is needed'));
      continue;
    }
    if (field.intent === 'family_employment_conflict' || field.intent === 'restrictive_covenant' || field.intent === 'profile_accuracy') {
      const rule = matchingAttestationRule(field.label, profile.attestation_rules);
      if (rule && control instanceof HTMLInputElement && (control.type === 'checkbox' || control.type === 'radio')) {
        if (rule.answer) control.click();
        items.push(item(field, rule.answer ? 'filled' : 'already_present', `Applied approved declaration: ${rule.intent}`));
      } else items.push(item(field, 'blocked', 'Declaration needs candidate review'));
      continue;
    }
    const value = profileValueForLabel(field.label, profile);
    if (!value) {
      if (field.required) items.push(item(field, 'unresolved', 'Required field has no profile value'));
      continue;
    }
    if (setValue(control, value)) {
      await settleCombobox(control, value);
      items.push(item(field, 'filled', 'Value verified'));
    } else items.push(item(field, 'failed', 'Control rejected the value'));
  }

  const unresolved = items.some(({ state }) => state === 'unresolved' || state === 'blocked' || state === 'failed');
  const next = !unresolved && items.some(({ state }) => state === 'filled')
    ? Array.from(document.querySelectorAll<HTMLButtonElement>('button')).find((button) => !button.disabled && /^(next|continue|save and continue)$/i.test(button.innerText.trim()))
    : undefined;
  if (next) next.click();
  return { provider, items, nextAction: next ? 'advanced' : unresolved ? 'waiting' : 'review' };
}
