import { normalizeText } from '../core/field-mapping';

export type WorkdayStage = 'job' | 'account' | 'experience' | 'questions' | 'self_id' | 'review' | 'confirmation' | 'unknown';

export function detectWorkdayStage(headings: string[]): WorkdayStage {
  const text = normalizeText(headings.join(' '));
  if (/thank you|application submitted|confirmation/.test(text)) return 'confirmation';
  if (/review.*submit|review application/.test(text)) return 'review';
  if (/self identify|voluntary self|disability|veteran/.test(text)) return 'self_id';
  if (/my experience|work experience|education|resume cv/.test(text)) return 'experience';
  if (/application questions|screening questions|questionnaire/.test(text)) return 'questions';
  if (/sign in|create account|candidate home|password/.test(text)) return 'account';
  if (/apply for this job|job details|job description/.test(text)) return 'job';
  return 'unknown';
}

export function visibleHeadings(root: ParentNode = document): string[] {
  return Array.from(root.querySelectorAll<HTMLElement>('h1, h2, [role="heading"]'))
    .filter((heading) => Boolean(heading.getClientRects().length))
    .map((heading) => heading.innerText.trim())
    .filter(Boolean)
    .slice(0, 6);
}
