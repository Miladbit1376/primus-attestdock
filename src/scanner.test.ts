import { describe, expect, it } from 'vitest'
import { scanCode, type RuleId } from './scanner'

const ids = (code: string, environment: 'frontend' | 'backend' = 'backend') => scanCode(code, environment).findings.map(item => item.id)
const has = (code: string, id: RuleId, environment: 'frontend' | 'backend' = 'backend') => expect(ids(code, environment)).toContain(id)

describe('AttestDock rules', () => {
  it('finds a client app secret and redacts its value', () => {
    const report = scanCode("const appSecret = 'DEMO_ONLY';", 'frontend')
    expect(report.findings[0].id).toBe('ATTESTDOCK-001')
    expect(JSON.stringify(report)).not.toContain('DEMO_ONLY')
  })
  it('does not flag a server-side app secret', () => expect(ids("const appSecret = 'DEMO_ONLY';")).not.toContain('ATTESTDOCK-001'))
  it('finds a public secret variable', () => has('const VITE_APP_SECRET = import.meta.env.VITE_APP_SECRET;', 'ATTESTDOCK-001'))
  it('finds a decision without verification', () => has('function use(attestation: unknown) { grantAccess(attestation) }', 'ATTESTDOCK-002'))
  it('does not flag a returned attestation alone', () => expect(ids('async function make() { const attestation = await zkTLS.startAttestation(request); return attestation }')).not.toContain('ATTESTDOCK-002'))
  it('finds missing business checks', () => has('function use(attestation: any) { if (zkTLS.verifyAttestation(attestation)) grantAccess(attestation) }', 'ATTESTDOCK-003'))
  it('accepts visible source checks', () => expect(ids('function use(attestation: any) { if (!zkTLS.verifyAttestation(attestation)) return; if (attestation.request.url !== expectedUrl) return; grantAccess(attestation) }')).not.toContain('ATTESTDOCK-003'))
  it('finds sensitive logging', () => has('console.log(attestation)', 'ATTESTDOCK-004'))
  it('allows status-only logging', () => expect(ids("console.info('Attestation checked')")).not.toContain('ATTESTDOCK-004'))
  it('finds missing freshness checks', () => has('function use(attestation: any) { if (zkTLS.verifyAttestation(attestation)) grantAccess(attestation) }', 'ATTESTDOCK-005'))
  it('accepts a timestamp comparison', () => expect(ids('function use(attestation: any) { if (!zkTLS.verifyAttestation(attestation)) return; if (Date.now() - attestation.timestamp > maxAgeMs) return; grantAccess(attestation) }')).not.toContain('ATTESTDOCK-005'))
  it('finds an ignored verification result', () => has('function use(attestation: any) { zkTLS.verifyAttestation(attestation); grantAccess(attestation) }', 'ATTESTDOCK-006'))
  it('accepts a checked verification result', () => expect(ids('function use(attestation: any) { const verified = zkTLS.verifyAttestation(attestation); if (!verified) return; grantAccess(attestation) }')).not.toContain('ATTESTDOCK-006'))
  it('finds a failure branch that only logs', () => has("function use(attestation: any) { const verified = zkTLS.verifyAttestation(attestation); if (!verified) console.warn('invalid'); grantAccess(attestation) }", 'ATTESTDOCK-006'))
  it('does not treat an unrelated comparison as freshness', () => has('function use(attestation: any) { if (!zkTLS.verifyAttestation(attestation)) return; if (count > 0) console.info(attestation.timestamp); grantAccess(attestation) }', 'ATTESTDOCK-005'))
  it('reports malformed code', () => expect(scanCode('function (', 'unknown').error).toMatch(/Could not parse/))
  it('rejects unsupported file types', () => expect(scanCode('hello', 'unknown', 'file.sol').error).toMatch(/Use a/))
  it.each([
    ['file.js', 'function use(attestation) { grantAccess(attestation) }'],
    ['file.jsx', 'function View() { return <div>Ready</div> }'],
    ['file.ts', 'function use(attestation: unknown): void { grantAccess(attestation) }'],
    ['file.tsx', 'function View(): JSX.Element { return <div>Ready</div> }']
  ])('parses %s', (fileName, code) => expect(scanCode(code, 'unknown', fileName).error).toBeUndefined())
})
