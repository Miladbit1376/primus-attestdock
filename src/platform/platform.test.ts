import { describe, expect, it } from 'vitest'
import { PrimusEnterpriseAdapter, PrimusNetworkAdapter, SimulatedProofAdapter, primusErrorMessage } from './adapters.ts'
import { disclosurePreview } from './privacy.ts'
import { ProofSessionManager } from './proofs.ts'
import { ProviderRegistry } from './providers.ts'
import { TemplateRegistry } from './templates.ts'
import type { ProofTemplate } from './types.ts'

const providers = new ProviderRegistry()
const templates = new TemplateRegistry(providers)
const input = { providerId: 'google' as const, claimId: 'account_email', recipient: 'demo-user', consent: true, mode: 'simulated' as const }

describe('provider and template registries', () => {
  it('lists five candidates without a ready provider', () => {
    const items = providers.list()
    expect(items.map(item => item.id)).toEqual(['google', 'discord', 'x', 'github', 'tiktok'])
    expect(items.every(item => item.availability === 'template_pending')).toBe(true)
  })
  it('does not invent a template ID or disclosure', () => {
    expect(templates.list()).toEqual([])
    expect(disclosurePreview().available).toBe(false)
  })
  it('rejects an invented upstream template ID', () => {
    const item: ProofTemplate = { id: 'google-email-v1', providerId: 'google', claimId: 'account_email', primusTemplateId: 'DEMO_TEMPLATE', version: '1', description: 'Example', disclosedFields: ['email'], supportedConditions: [], adapter: 'enterprise', status: 'active' }
    expect(() => templates.register(item)).toThrow(/verified Primus template UUID/)
  })
  it('allows an approved template to be disabled', () => {
    const local = new TemplateRegistry(providers)
    local.register({ id: 'approved-v1', providerId: 'google', claimId: 'account_email', primusTemplateId: '123e4567-e89b-42d3-a456-426614174000', version: '1', description: 'Test-only configuration', disclosedFields: ['email'], supportedConditions: [], adapter: 'enterprise', status: 'active' })
    expect(local.resolveActive('google', 'account_email')).toBeDefined()
    local.disable('approved-v1')
    expect(local.resolveActive('google', 'account_email')).toBeUndefined()
  })
})

describe('proof lifecycle', () => {
  it('requires consent and a known claim', () => {
    const manager = new ProofSessionManager(providers, templates)
    expect(() => manager.create({ ...input, consent: false })).toThrow(/consent/)
    expect(() => manager.create({ ...input, claimId: 'server_membership' })).toThrow(/Unknown/)
  })
  it('keeps simulated sessions separate from live proofs', () => {
    const manager = new ProofSessionManager(providers, templates)
    const session = manager.create(input)
    expect(session.mode).toBe('simulated')
    expect(session.templateId).toBeNull()
    expect(() => manager.transition(session.id, 'verified')).toThrow(/trusted verifier/)
    expect(() => manager.create({ ...input, mode: 'live' })).toThrow(/unavailable/)
  })
  it('expires sessions', () => {
    let time = 1_000_000
    const manager = new ProofSessionManager(providers, templates, () => time, false, 1000)
    const session = manager.create(input)
    time += 1001
    expect(manager.get(session.id)?.status).toBe('expired')
    expect(() => manager.transition(session.id, 'awaiting_user')).toThrow(/Invalid/)
  })
  it('rejects replay after consumption', () => {
    const manager = new ProofSessionManager(providers, templates)
    const session = manager.create(input)
    manager.transition(session.id, 'awaiting_user')
    manager.transition(session.id, 'awaiting_extension')
    manager.transition(session.id, 'generating')
    manager.transition(session.id, 'submitted')
    manager.consume(session.id)
    expect(() => manager.consume(session.id)).toThrow(/replayed/)
  })
  it('rejects an invalid state jump', () => {
    const manager = new ProofSessionManager(providers, templates)
    const session = manager.create(input)
    expect(() => manager.transition(session.id, 'submitted')).toThrow(/Invalid/)
  })
})

describe('development simulation', () => {
  it('returns a simulated result that is never verified', async () => {
    const manager = new ProofSessionManager(providers, templates)
    const adapter = new SimulatedProofAdapter(manager)
    const session = await adapter.createProofSession(input)
    const result = await adapter.executeProof(session)
    expect(result.mode).toBe('simulated')
    expect(result.status).toBe('submitted')
    expect(result.attestation).toBeUndefined()
    expect((await adapter.verifyProof(result)).verified).toBe(false)
    expect(() => manager.transition(session.id, 'verified')).toThrow(/trusted verifier/)
  })
})

describe('disabled Primus adapters', () => {
  it('maps known SDK errors without exposing raw details', () => {
    expect(primusErrorMessage({ code: '00006' })).toMatch(/extension/)
    expect(primusErrorMessage({ code: '00004' })).toMatch(/cancelled/)
    expect(primusErrorMessage({ code: 'unknown', secret: 'test-only' })).not.toContain('test-only')
  })
  it('checks the selected Base chain', () => {
    const adapter = new PrimusNetworkAdapter()
    expect(() => adapter.validateChain(84532, 'development')).not.toThrow()
    expect(() => adapter.validateChain(8453, 'development')).toThrow(/Switch/)
  })
  it('fails closed for enterprise and network flows', async () => {
    await expect(new PrimusEnterpriseAdapter().initialize()).rejects.toThrow(/No approved/)
    await expect(new PrimusNetworkAdapter().initialize()).rejects.toThrow(/No approved/)
  })
})
