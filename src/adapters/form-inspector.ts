import type { FieldIntent, FieldKind, NormalizedField } from '../core/application';
import { attestationIntentForLabel, normalizeText } from '../core/field-mapping';

type Control = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export function controlLabel(control: Control): string {
  const labels = Array.from(control.labels ?? []).map((label) => label.textContent ?? '');
  const parentLabel = control.closest('label')?.textContent ?? '';
  const legend = control.closest('fieldset')?.querySelector('legend')?.textContent ?? '';
  const placeholder = control instanceof HTMLSelectElement ? '' : control.placeholder;
  return normalizeText([labels.join(' '), parentLabel, legend, control.getAttribute('aria-label') ?? '', control.name, placeholder].join(' '));
}

function kindFor(control: Control): FieldKind {
  if (control instanceof HTMLTextAreaElement) return 'textarea';
  if (control instanceof HTMLSelectElement) return 'select';
  if (control.type === 'checkbox') return 'checkbox';
  if (control.type === 'radio') return 'radio';
  if (control.type === 'file') return 'file';
  return 'text';
}

export function intentForLabel(label: string, kind: FieldKind, identifier = ''): FieldIntent {
  if (kind === 'file' && /resume|cv|curriculum vitae/.test(`${label} ${identifier}`)) return 'resume';
  if (kind === 'file' && !/cover.?letter/.test(`${label} ${identifier}`)) return 'resume';
  if (/^name$|full name|legal name/.test(label)) return 'full_name';
  if (/\b(last|family|surname)\b/.test(label)) return 'last_name';
  if (/\b(first|given)\b/.test(label)) return 'first_name';
  if (/email/.test(label)) return 'email';
  if (/nationality/.test(label)) return 'country';
  if (/\b(phone|mobile|telephone)\b/.test(label)) return 'phone';
  if (/linkedin/.test(label)) return 'linkedin';
  if (/github/.test(label)) return 'github';
  if (/portfolio|personal website|website url/.test(label)) return 'portfolio';
  if (/\bcity\b/.test(label)) return 'city';
  if (/\bcountry\b/.test(label)) return 'country';
  if (/sponsor|sponsorship|visa support/.test(label)) return 'requires_sponsorship';
  if (/authorized|authorised|right to work|work permit/.test(label)) return 'work_authorization';
  return attestationIntentForLabel(label) ?? 'unknown';
}

export function inspectControls(root: ParentNode = document): Array<{ control: Control; field: NormalizedField }> {
  return Array.from(root.querySelectorAll<Control>('input, textarea, select')).filter((control) => control.type !== 'hidden').map((control, index) => {
    const label = controlLabel(control);
    const kind = kindFor(control);
    return {
      control,
      field: {
        key: control.id || control.name || `${kind}-${index}`,
        label,
        kind,
        intent: intentForLabel(label, kind, `${control.id} ${control.name}`),
        required: control.required || control.getAttribute('aria-required') === 'true',
        visible: Boolean(control.getClientRects().length)
      }
    };
  });
}
