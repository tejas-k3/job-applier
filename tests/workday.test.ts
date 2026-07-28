import { describe, expect, it } from 'vitest';
import { detectWorkdayStage } from '../src/adapters/workday';

describe('Workday stage detection', () => {
  it('classifies the main external-candidate stages', () => {
    expect(detectWorkdayStage(['My Experience'])).toBe('experience');
    expect(detectWorkdayStage(['Application Questions'])).toBe('questions');
    expect(detectWorkdayStage(['Voluntary Self-Identification'])).toBe('self_id');
    expect(detectWorkdayStage(['Review and Submit'])).toBe('review');
  });
});
