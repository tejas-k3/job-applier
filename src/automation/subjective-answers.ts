/**
 * TODO(local-answer-provider): Add a pluggable, candidate-consented provider
 * for subjective application answers. The default must be an on-device or
 * user-configured endpoint; do not automate the ChatGPT consumer website or
 * reuse an anonymous browser session as an API backend.
 *
 * The provider must receive only the saved resume, the visible job description,
 * and the exact question. It must return an answer plus the resume evidence it
 * used. The fill runner must leave the field untouched when evidence is absent.
 */
export type SubjectiveAnswerDraft = {
  answer: string;
  evidence: string[];
  supported: boolean;
};
