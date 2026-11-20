import { describe, expect, it } from 'vitest'
import { runXAssuranceSuite } from './assurance.ts'

describe('X proof assurance report', () => {
  it('runs the actual server decision path and rejects each seeded policy violation', async () => {
    const report = await runXAssuranceSuite()
    expect(report.summary).toEqual({ passed: 10, failed: 0 })
    expect(report.checks.find(check => check.id === 'valid-x')).toMatchObject({ expected: 'accepted', observed: 'accepted' })
    expect(report.checks.find(check => check.id === 'wrong-recipient')).toMatchObject({ observed: 'WALLET_BINDING' })
    expect(report.checks.find(check => check.id === 'replayed-proof')).toMatchObject({ observed: 'REPLAY_DETECTED' })
    expect(JSON.stringify(report)).not.toContain('synthetic-secret')
    expect(JSON.stringify(report)).not.toContain('synthetic-signature')
  })
})
