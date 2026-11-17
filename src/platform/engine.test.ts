import { describe, expect, it } from 'vitest'
import { SimulatedProofAdapter } from './adapters.ts'
import { ProofEngine } from './engine.ts'
import { ProofSessionManager } from './proofs.ts'
import { ProviderRegistry } from './providers.ts'
import { TemplateRegistry } from './templates.ts'

describe('proof engine trust boundary', () => {
  it('never marks a simulated result verified', async () => {
    const providers = new ProviderRegistry()
    const manager = new ProofSessionManager(providers, new TemplateRegistry(providers))
    const engine = new ProofEngine(new SimulatedProofAdapter(manager))
    const session = await engine.create({ providerId: 'google', claimId: 'account_email', recipient: 'demo-user', consent: true, mode: 'simulated' })
    const result = await engine.execute(session)
    expect((await engine.verify(session, result)).verified).toBe(false)
  })
  it('refuses live sessions without a trusted verifier', async () => {
    const providers = new ProviderRegistry()
    const manager = new ProofSessionManager(providers, new TemplateRegistry(providers))
    const engine = new ProofEngine(new SimulatedProofAdapter(manager))
    await expect(engine.create({ providerId: 'google', claimId: 'account_email', recipient: 'demo-user', consent: true, mode: 'live' })).rejects.toThrow(/Trusted server/)
  })
})
