import { describe, expect, it } from 'vitest'
import { explainPrimusError, supportSummary } from './diagnostics.ts'

describe('Primus error helper', () => {
  it('does not infer why verification requirements failed from 00104', () => {
    const result = explainPrimusError('00104')
    expect(result.meaning).toBe('Verification requirements not met.')
    expect(result.nextStep).toContain('does not identify')
  })
  it('retains unknown codes and omits proof data from a support summary', () => {
    expect(explainPrimusError('77777').certainty).toBe('unknown')
    const summary = supportSummary({ code: '77777', subcode: '', sdkVersion: '0.3.15', stage: 'startAttestation' })
    expect(summary).toContain('Error code: 77777')
    expect(summary).toContain('Subcode: not recorded')
    expect(summary).not.toContain('attestation:')
  })
})
