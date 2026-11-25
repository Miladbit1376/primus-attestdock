import { describe, expect, it } from 'vitest'
import { runExternalSuite, type ExternalModule } from './external-assurance.ts'

const target = {
  name: 'Test app', recipient: '0x1111111111111111111111111111111111111111',
  sourceUrl: 'https://api.example.test/account', field: 'account_id', value: 'alice', maxAgeMs: 60_000
}

describe('external policy suite', () => {
  it('flags an adapter that allows every input', async () => {
    const module: ExternalModule = { target, createAdapter: () => ({ decide: () => true }) }
    const report = await runExternalSuite(module)
    expect(report.summary).toEqual({ passed: 1, failed: 9 })
    expect(report.checks.find(check => check.id === 'replayed-proof')).toMatchObject({ observed: 'allow', status: 'fail' })
    expect(JSON.stringify(report)).not.toContain('attestdock-synthetic-signature')
    expect(JSON.stringify(report)).not.toContain(target.value)
  })

  it('requires the first replay decision to allow', async () => {
    const module: ExternalModule = { target, createAdapter: () => ({ decide: () => false }) }
    const report = await runExternalSuite(module)
    expect(report.checks.find(check => check.id === 'matching-proof')).toMatchObject({ observed: 'deny', status: 'fail' })
    expect(report.checks.find(check => check.id === 'replayed-proof')).toMatchObject({ observed: 'error', status: 'fail' })
  })

  it('does not put an adapter exception in the report', async () => {
    const module: ExternalModule = { target, createAdapter: () => ({ decide: () => { throw new Error('PRIVATE_TOKEN') } }) }
    const report = await runExternalSuite(module)
    expect(report.summary.failed).toBe(10)
    expect(JSON.stringify(report)).not.toContain('PRIVATE_TOKEN')
  })

  it('rejects an invalid target before it calls the adapter', async () => {
    let called = false
    const module: ExternalModule = { target: { ...target, sourceUrl: 'http://example.test/' }, createAdapter: () => { called = true; return { decide: () => true } } }
    await expect(runExternalSuite(module)).rejects.toThrow('target.sourceUrl')
    expect(called).toBe(false)
  })
})
